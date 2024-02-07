import type { NextFunction, Request, Response } from 'express';
import catchAsyncError from '../utils/catchAsyncError';
import FormResponse from '../models/formResponseModel';
import Form from '../models/formModel';
import AppError from '../utils/appError';
import json2csv from 'json2csv';

// Function to strip HTML tags
const stripHtmlTags = (htmlString: string) => {
  return htmlString.replace(/<\/?[^>]+(>|$)/g, '');
};



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

export const createResponse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { response } = req.body;

    if (!response)
      return next(new AppError('Please provide response of the form!', 400));

    const form = await Form.findById(req.params.id);
    if (!form) return next(new AppError('No form found with that ID', 404));
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

export const exportForm =async (req: Request, res: Response) => {
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

    // Prepare CSV data
    const csvData = json2csv.parse(responses.map(response => {
      const rowData: Record<string, any> = { formId: formId.toString(), formName: form.name, useruniquecode: response._id.toString(), };

       // Populate rowData with responses
       response.response.forEach(answer => {
        const questionName = stripHtmlTags(answer.question);
        rowData[questionName] = answer.answer;
      });

      return rowData;
    }),
    { fields: ['formId', 'formName', 'useruniquecode', ...uniqueQuestions], header: true }
  );



    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=formResponse_${form.name}.csv`);

    // Write form name as the first row (header)
    const csvWithHeader = `${form.name}\n${csvData}`;

    // Send CSV data in the response
    res.status(200).send(csvWithHeader);
  } catch (error) {
    console.error('Error exporting form data to CSV:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}