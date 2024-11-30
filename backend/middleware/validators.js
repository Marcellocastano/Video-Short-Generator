import { body, param, validationResult } from 'express-validator';

// Middleware per gestire gli errori di validazione
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Errori di validazione',
      errors: errors.array() 
    });
  }
  next();
};

// Validazione per la creazione/aggiornamento video
export const validateVideo = [
  body('title')
    .trim()
    .notEmpty().withMessage('Il titolo è obbligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('Il titolo deve essere tra 3 e 100 caratteri'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('La descrizione non può superare 5000 caratteri'),
  
  body('publishAt')
    .optional()
    .isISO8601().withMessage('La data di pubblicazione deve essere in formato ISO 8601')
    .custom(value => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('La data di pubblicazione deve essere futura');
      }
      return true;
    }),
  
  body('hashtags')
    .optional()
    .custom((value, { req }) => {
      if (!value) return true;
      
      try {
        const hashtags = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(hashtags)) {
          throw new Error('Gli hashtag devono essere un array');
        }
        
        const validHashtags = hashtags.every(tag => 
          typeof tag === 'string' && 
          tag.length >= 2 && 
          tag.length <= 50 &&
          /^[a-zA-Z0-9_]+$/.test(tag)
        );
        
        if (!validHashtags) {
          throw new Error('Gli hashtag devono contenere solo lettere, numeri e underscore');
        }
        
        return true;
      } catch (error) {
        throw new Error('Formato hashtag non valido');
      }
    }),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'unlisted']).withMessage('Privacy non valida'),
  
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 }).withMessage('Codice lingua non valido')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/).withMessage('Formato lingua non valido (es: it, en-US)'),
  
  handleValidationErrors
];

// Validazione ID video
export const validateVideoId = [
  param('id')
    .isInt().withMessage('ID video non valido'),
  handleValidationErrors
];
