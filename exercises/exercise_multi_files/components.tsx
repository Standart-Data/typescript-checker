// React компонент для отображения карточки пользователя
import React, { useState } from "react";
import { User, UserRole } from "./types";

// Интерфейс для пропсов компонента UserCard
interface UserCardProps {
  user: User;
  showEmail?: boolean;
  onEdit?: (user: User) => void;
}

// Компонент для отображения карточки пользователя
export const UserCard: React.FC<UserCardProps> = ({
  user,
  showEmail = false,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Функция для определения цвета бейджа в зависимости от роли
  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return "red";
      case UserRole.MODERATOR:
        return "blue";
      default:
        return "gray";
    }
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      {showEmail && <p>Email: {user.email}</p>}
      <p>ID: {user.id}</p>
      <span
        className="badge"
        style={{ backgroundColor: getRoleBadgeColor(user.role) }}
      >
        {user.role}
      </span>

      {isExpanded && (
        <div className="user-details">
          <p>Registered: {user.registeredAt.toDateString()}</p>
          <p>Last active: {user.lastLogin.toDateString()}</p>
        </div>
      )}

      <div className="actions">
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Less info" : "More info"}
        </button>
        {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
      </div>
    </div>
  );
};

// Интерфейс для пропсов компонента UserList
interface UserListProps {
  users: User[];
}

// Компонент для отображения списка пользователей
export const UserList: React.FC<UserListProps> = ({ users }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Фильтрация пользователей по роли
  const filteredUsers = selectedRole
    ? users.filter((user) => user.role === selectedRole)
    : users;

  return (
    <div className="user-list">
      <div className="filter-controls">
        <button
          onClick={() => setSelectedRole(null)}
          className={selectedRole === null ? "active" : ""}
        >
          All
        </button>
        <button
          onClick={() => setSelectedRole(UserRole.ADMIN)}
          className={selectedRole === UserRole.ADMIN ? "active" : ""}
        >
          Admins
        </button>
        <button
          onClick={() => setSelectedRole(UserRole.MODERATOR)}
          className={selectedRole === UserRole.MODERATOR ? "active" : ""}
        >
          Moderators
        </button>
        <button
          onClick={() => setSelectedRole(UserRole.USER)}
          className={selectedRole === UserRole.USER ? "active" : ""}
        >
          Users
        </button>
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} showEmail={true} />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <p className="no-results">No users found</p>
      )}
    </div>
  );
};
