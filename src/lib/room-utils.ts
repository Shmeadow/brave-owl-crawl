export const generateRandomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 alphanumeric characters
};