import { Router } from 'express';
import {
  createForm,
  deleteForm,
  deleteForms,
  getAllForms,
  getForm,
  updateForm,
  getAllFormsAdmin,
} from '../controllers/formController';
import verifyJWT from '../middleware/verifyJWT';
import {
  createResponse,
  getAllResponses,
  exportForm,
  getTotalResponses,
} from '../controllers/formResponseController';

const router = Router();

router.route('/').get(verifyJWT, getAllForms).post(verifyJWT, createForm);
router.patch('/bulk-delete', verifyJWT, deleteForms);
router
  .route('/:id')
  .get(getForm)
  .patch(verifyJWT, updateForm)
  .delete(verifyJWT, deleteForm);
router
  .route('/:id/responses')
  .get(verifyJWT, getAllResponses)
  .post(createResponse);

  router.get('/exceldownload/:id', exportForm);
  router.get('/admin/getForms/:id', getAllFormsAdmin);
  router.get('/:id/getallresponse',getTotalResponses);

export default router;
