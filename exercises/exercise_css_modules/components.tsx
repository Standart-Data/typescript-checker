import React from "react";
import buttonStyles from "./button.module.css";
import cardStyles from "./card.module.css";
import classNames from "classnames";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  icon,
}: ButtonProps) {
  const buttonClass = [
    buttonStyles.button,
    buttonStyles[`button--${variant}`],
    disabled && buttonStyles["button--disabled"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames(buttonClass)}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={buttonStyles.icon}>{icon}</span>}
      {children}
    </button>
  );
}

interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  avatar?: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "error";
  };
  actions?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  children,
  avatar,
  badge,
  actions,
}: CardProps) {
  const badgeClass = badge
    ? [cardStyles.badge, cardStyles[`badge--${badge.variant}`]].join(" ")
    : "";

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.header}>
        <div>
          <h3 className={cardStyles.title}>{title}</h3>
          {subtitle && <p className={cardStyles.subtitle}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {badge && <span className={badgeClass}>{badge.text}</span>}
          {avatar && (
            <img src={avatar} alt="Avatar" className={cardStyles.avatar} />
          )}
        </div>
      </div>

      <div className={cardStyles.content}>{children}</div>

      {actions && <div className={cardStyles.footer}>{actions}</div>}
    </div>
  );
}

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const getBadgeVariant = (role: string): "success" | "warning" | "error" => {
    switch (role.toLowerCase()) {
      case "admin":
        return "error";
      case "moderator":
        return "warning";
      default:
        return "success";
    }
  };

  return (
    <Card
      title={user.name}
      subtitle={user.email}
      avatar={user.avatar}
      badge={{
        text: user.role,
        variant: getBadgeVariant(user.role),
      }}
      actions={
        <>
          {onEdit && (
            <Button variant="secondary" onClick={() => onEdit(user.id)}>
              Редактировать
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(user.id)}>
              Удалить
            </Button>
          )}
        </>
      }
    >
      <p>Пользователь системы с ролью {user.role.toLowerCase()}</p>
    </Card>
  );
}
