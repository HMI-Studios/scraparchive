DROP DATABASE IF EXISTS scraparchive;
CREATE DATABASE scraparchive;
USE scraparchive;

CREATE TABLE user (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(32) UNIQUE,
  email VARCHAR(64) UNIQUE,
  password VARCHAR(64),
  salt VARCHAR(64),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  default_next VARCHAR(16),
  PRIMARY KEY (id)
);

CREATE TABLE session (
  id INT NOT NULL AUTO_INCREMENT,
  hash VARCHAR(64),
  user_id INT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user (id),
  PRIMARY KEY (id)
);

CREATE TABLE contact (
  user_id INT NOT NULL,
  contact_id INT NOT NULL,
  accepted BOOLEAN,
  FOREIGN KEY (user_id) REFERENCES user (id),
  FOREIGN KEY (contact_id) REFERENCES user (id)
);

CREATE TABLE bucket (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE,
  title VARCHAR(64),
  bucket_id INT,
  FOREIGN KEY (bucket_id) REFERENCES bucket (id),
  PRIMARY KEY (id)
);

CREATE TABLE user_bucket_permissions (
  user_id INT,
  bucket_id INT,
  permissions_lvl TINYINT, /* 0 - no permission, 1 - read, 2 - read/suggest, 3 - read/write, 4 - read/write/delete, 5 - full admin */
  FOREIGN KEY (user_id) REFERENCES user (id),
  FOREIGN KEY (bucket_id) REFERENCES bucket (id)
);

CREATE TABLE scrap (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE,
  author_id INT,
  bucket_id INT,
  title VARCHAR(64),
  body TEXT,
  earthdate INT,
  earthtime TIME,
  canon_status TINYINT, /* 0 - not canon, 1 - headcanon, 2 - potential canon, 3 - mostly canon, 4 - canon draft, 5 - confirmed canon */
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES user (id),
  FOREIGN KEY (bucket_id) REFERENCES bucket (id),
  PRIMARY KEY (id)
);
