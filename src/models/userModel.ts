export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  name?: string; // Add optional name to User interface
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes {
  email: string;
  password: string; // This will be the hashed password when passed to internal createUser
  role: 'admin' | 'customer';
  name?: string;
}

// Optional: UserDTO for sending user data to client (without password)
export interface UserDTO {
  id: number;
  email: string;
  role: 'admin' | 'customer';
  name?: string; // Add optional name to UserDTO interface
  createdAt: Date;
  updatedAt: Date;
}
