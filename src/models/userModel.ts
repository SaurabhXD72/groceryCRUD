export interface User {
    id: number;
    email: string;
    password: string;
    role: 'admin' | 'customer';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserCreationAttributes {
    email: string;
    password: string;
    role: 'admin' | 'customer';
  }
  
  // Optional: UserDTO for sending user data to client (without password)
  export interface UserDTO {
    id: number;
    email: string;
    role: 'admin' | 'customer';
    createdAt: Date;
    updatedAt: Date;
  }