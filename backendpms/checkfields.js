require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI_PMS).then(async () => {
  const A = require('./src/pms/models/Assessment');
  const doc = await A.findOne({ phonicsScore: { $ne: null } });
  const obj = doc.toObject();
  const skip = ['_id','student','createdAt','updatedAt','__v','semester','assessedBy','term','assessmentDate'];
  const nonNull = Object.entries(obj).filter(([k,v]) => v !== null && !skip.includes(k));
  console.log('Non-null fields:');
  nonNull.forEach(([k,v]) => console.log(` ${k}: ${v}`));
  process.exit(0);
});
