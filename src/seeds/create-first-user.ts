import mongoose from 'mongoose';
import { User } from '../database/user.model.js';
import { Bank } from '../database/bank.model.js';
import { Account } from '../database/account.model.js';
import { Media } from '../database/media-upload.model.js';
import { hashPassword } from '../libs/utils/password-hash.js';

const firstUser = {
  name: 'Admin_Saher',
  displayName: 'Admin Saher',
  image: '69c9370b5a219f0b372c5483',
  role: 'admin',
  email: 'admin@saher.com',
  emailVerified: true,
  password: '',
};

const firstBank = {
  accountHolderName: 'Admin Saher',
  bankName: 'SAHER INDIA',
  accountNumber: '98375923709349234',
  ifcs: 'SAHE0123456',
  branch: 'BRANCH',
  mobileNumber: '9988776655',
};

const firstImage = {
  alt: 'first-images',
  src: '/uploads/images/c1821c2a-7a05-414c-a54d-b6780e205031.webp',
};

const firstAccount = {
  gender: 'other',
  dateOfBirth: new Date(),
  dateOfJoining: new Date(),
  phoneNumber: '9988776655',
  secondaryPhoneNumber: '9988776655',
  employeeId: 'first-000',
  department: 'FIRST',
  designation: 'FIRST',
  employeeType: 'full-time',
  salaryStructure: '0000000',
  address: 'First Address',
  aadhar: '69c9370b5a219f0b372c5483',
  pan: '69c9370b5a219f0b372c5483',
  resume: '69c9370b5a219f0b372c5483',
};

const createFirstUser = async () => {
  const session = await mongoose.startSession();
  const first = await User.find();
  if (first.length !== 0) return null;

  const password = await hashPassword('ADMIN000');

  try {
    const user = await session.withTransaction(async () => {
      const image = await Media.create(firstImage);
      await image.save({ session });

      firstUser.image = image._id.toString();
      firstUser.password = password;
      firstAccount.aadhar = image._id.toString();
      firstAccount.pan = image._id.toString();
      firstAccount.resume = image._id.toString();

      const user = new User(firstUser);
      await user.save({ session });

      const bank = new Bank(firstBank);
      await bank.save({ session });

      const account = new Account({
        user: user._id,
        bank: bank._id,
        ...firstAccount,
      });

      await account.save({ session });
      return user;
    });

    // ❗ Ensure user exists after transaction
    if (!user) {
      throw new Error('User creation failed.');
    }
  } catch (err) {
    console.error(err);
  }
};

export default createFirstUser;
