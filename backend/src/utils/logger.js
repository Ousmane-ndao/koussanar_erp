// Logger utility pour formater les erreurs dans la console

export const logError = (context, error, req = null) => {
  console.error('='.repeat(60));
  console.error(`[${context}] Error at ${new Date().toISOString()}`);
  
  if (req) {
    console.error('Request:', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      userId: req.user?.id,
    });
  }
  
  console.error('Error Details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  
  console.error('='.repeat(60));
};

export const logInfo = (context, message, data = {}) => {
  console.log(`[${context}] ${message}`, data);
};





















