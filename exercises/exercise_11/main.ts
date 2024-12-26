type Moderator = {
  id: number;
  name: string;
  resetUser: () => void;
  (message: string)
};