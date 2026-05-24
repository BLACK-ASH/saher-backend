import jwt from 'jsonwebtoken';

export type ReqUser = {
  id: string;
  name: string;
  role: 'user' | 'manager' | 'admin';
  email: string;
};

export const generateToken = (data: ReqUser) => {
  const accessToken = jwt.sign(data, process.env.JWT_ACCESS_SECRET!, {
    algorithm: 'HS384',
    expiresIn: '7d',
  });
  const refreshToken = jwt.sign(data, process.env.JWT_REFRESH_SECRET!, {
    algorithm: 'HS512',
    expiresIn: '90d',
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (accessToken: string) => {
  const data = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!, { algorithms: ['HS384'] });
  return data as ReqUser;
};

export const verifyRefreshToken = (refreshToken: string) => {
  const data = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, { algorithms: ['HS512'] });
  return data as ReqUser;
};
