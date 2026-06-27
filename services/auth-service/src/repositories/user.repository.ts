import { User, IUser } from '../models/user.model';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByVerificationToken(tokenHash: string): Promise<IUser | null> {
    return User.findOne({ verificationToken: tokenHash });
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'student' | 'admin';
    verificationToken?: string;
  }): Promise<IUser> {
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role || 'student',
      verificationToken: data.verificationToken || null,
    });
    return user.save();
  }

  async updateVerificationStatus(
    userId: string,
    isVerified: boolean
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { isVerified, verificationToken: null },
      { new: true }
    );
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expiresAt,
      },
      { new: true }
    );
  }

  async updatePassword(
    userId: string,
    passwordHash: string
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      { new: true }
    );
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}
