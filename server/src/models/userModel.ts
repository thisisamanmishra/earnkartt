import { type Query, Schema, model } from 'mongoose';

interface IUser {
  name: string;
  email: string;
  avatar: string | null;
  password: string;
  passwordChangedAt?: Date;
  refreshToken: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  isApproved: boolean; // New field for approval status
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      select: false,
    },
    passwordChangedAt: Date,
    refreshToken: [String],
    passwordResetToken: String,
    passwordResetExpires: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
    isApproved: {
      type: Boolean,
      default: false, // New field defaults to false
    },
  },
  { timestamps: true },
);

// Middleware to exclude deleted and unapproved users from queries
userSchema.pre(/^find/, function (this: Query<IUser | IUser[], IUser>, next) {
  this.where({ isDeleted: false }); // Include only approved and non-deleted users
  next();
});

export default model<IUser>('User', userSchema);
