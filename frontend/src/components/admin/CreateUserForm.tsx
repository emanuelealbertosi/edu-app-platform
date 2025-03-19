import React, { useState } from 'react';

interface CreateUserFormProps {
  onSubmit: (formData: UserFormData) => void;
}

export interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'parent' | 'student';
  parentId?: number | null;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    parentId: null
  });

  const handleChange = (field: keyof UserFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Username</label>
        <input
          type="text"
          className="form-control"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          required
        />
        <small className="text-muted">L'username deve contenere solo caratteri alfanumerici (lettere e numeri)</small>
      </div>
      
      {/* Altri campi del form potrebbero essere aggiunti qui */}
      
      <div className="mb-3">
        <button type="submit" className="btn btn-primary">Salva</button>
      </div>
    </form>
  );
};

export default CreateUserForm; 