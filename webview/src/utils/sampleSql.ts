export const SAMPLE_SQL = `CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(120),
  created_at TIMESTAMP
);

CREATE TABLE projects (
  id INT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE tasks (
  id INT PRIMARY KEY,
  project_id INT NOT NULL,
  assignee_id INT,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(40) NOT NULL,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id),
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id)
);`;
