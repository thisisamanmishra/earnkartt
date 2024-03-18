import type { NextFunction, Request, Response } from 'express';
import catchAsyncError from '../utils/catchAsyncError';
import FormResponse from '../models/formResponseModel';
import Form from '../models/formModel';
import AppError from '../utils/appError';
import ExcelJS from 'exceljs';
import User from '../models/userModel';

// Function to strip HTML tags
const stripHtmlTags = (htmlString: string) => {
  return htmlString.replace(/<\/?[^>]+(>|$)/g, '');
};


export const createResponse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { response } = req.body;

    if (!response)
      return next(new AppError('Please provide response of the form!', 400));

    const form = await Form.findById(req.params.id);
    if (!form) return next(new AppError('No form found with that ID', 404));

    const ownerId = form.user;

    // Fetch the form owner's details
    const ownerDetails = await User.findById(ownerId);
    if (!ownerDetails || !ownerDetails.isApproved) {
      form.isActive = false; // Set the form as inactive
      await form.save(); // Save the changes
      return next(new AppError('The form is no longer accepting submissions', 403));
    }

    if (!form.isActive)
      return next(
        new AppError('The form is no longer accepting submissions', 400),
      );

    const newResponse = await FormResponse.create({
      form: req.params.id,
      response,
    });

    res.status(201).json({
      status: 'success',
      data: {
        response: newResponse,
      },
    });
  },
);


export const getAllResponses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const form = await Form.findById(req.params.id);
    if (!form) return next(new AppError('No form found with that ID', 404));

    const responses = await FormResponse.find({ form: req.params.id }).exec();

    res.status(200).json({
      status: 'success',
      data: {
        responses,
      },
    });
  },
);


export const exportForm = async (req: Request, res: Response) => {
  try {
    const formId = req.params.id;
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    const responses = await FormResponse.find({ form: req.params.id }).exec();

    // Get the unique question fields from the responses
    const uniqueQuestions = Array.from(
      new Set(responses.flatMap(response => response.response.map(r => stripHtmlTags(r.question))))
    );

    // Prepare Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(form.name);

    // Apply header style with bold font and center alignment for the form name
    worksheet.getCell('A1').value = form.name;
    worksheet.getCell('A1').font = { bold: true, size: 24 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:U1');

    // Write headers for the rest of the data
    const headers = ['Campaign Name', 'Code', ...uniqueQuestions];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
    });

    // Process responses and prepare data for Excel rows
    responses.forEach(response => {
      const rowData: Record<string, any> = { formName: form.name };

      // Find the response with uniqueCode and include it in rowData
      const responseWithUniqueCode = response.response.find(r => r.uniqueCode);
      if (responseWithUniqueCode) {
        rowData.useruniquecode = responseWithUniqueCode.uniqueCode;
      }

      // Populate rowData with responses
      response.response.forEach(answer => {
        const questionName = stripHtmlTags(answer.question);
        rowData[questionName] = answer.answer;
      });

      // Write rowData to the worksheet
      worksheet.addRow(Object.values(rowData));
    });

     // Auto-fit column width based on content
     worksheet.columns.forEach(column => {
      if (column && column.key) { // Check if column exists and key is defined
        let maxLength = 0;
        worksheet.getColumn(column.key).eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength; // Minimum width of 10 characters
      }
    });

     // Generate Excel file buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for Excel download with the correct filename
    const filename = `${form.name.replace(/[^\w\s]/gi, '')}.xlsx`; // Remove special characters from form name
    console.log(filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting form data to Excel:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
export const getTotalResponses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Aggregate the responses to group them by form and count the total responses for each form
      const totalResponsesByForm = await FormResponse.aggregate([
        {
          $group: {
            _id: '$form',
            totalResponses: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'forms', // Assuming the collection name for Form model is 'forms'
            localField: '_id',
            foreignField: '_id',
            as: 'formDetails',
          },
        },
        {
          $unwind: '$formDetails',
        },
        {
          $project: {
            _id: 0,
            formId: '$_id',
            formName: '$formDetails.name',
            totalResponses: 1,
          },
        },
        {
          $sort: { formName: 1, formId: 1 }, // Sort by formName and form ID
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalResponsesByForm,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
