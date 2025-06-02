import styles from "./EmployeeCard.module.css";

export const EmployeeCard = ({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string;
}) => (
  <div>
    <img className={styles.avatar} src={avatarUrl} alt="" />
    <span className={styles.highlightName}>{name}</span>
  </div>
);
