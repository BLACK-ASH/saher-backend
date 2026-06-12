import mongoose from 'mongoose';

// const mailSchema = new mongoose.Schema(
//   {
//     from: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     to: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     cc: {
//       type: [mongoose.Schema.Types.ObjectId],
//       ref: 'User',
//     },
//     bcc: {
//       type: [mongoose.Schema.Types.ObjectId],
//       ref: 'User',
//     },
//     subject: {
//       type: String,
//       required: true,
//     },
//     body: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true },
// );
const mailSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  to: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
  },

  recipientType: {
    type: String,
    enum: ['TO', 'CC', 'BCC'],
    required: true,
  },

  subject: {
    type: String,
    required: true,
  },

  body: {
    type: String,
    required: true,
  },
});

type Mailtype = mongoose.InferSchemaType<typeof mailSchema>;
export const Mail = mongoose.model<Mailtype>('Mail', mailSchema);
