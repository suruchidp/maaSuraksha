import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
 user: {type:Schema.Types.ObjectId,ref:'User',required:true},
 content: {type:Schema.Types.ObjectId,ref:'EducationalContent',required:true},
 isSaved: {type:Boolean,default:false},
 readAt: Date,
}, {timestamps:true});
schema.index({user:1,content:1},{unique:true});
export const EducationProgress = mongoose.model('EducationProgress', schema);
