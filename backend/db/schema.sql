DROP DATABASE IF EXISTS scraparchive;
CREATE DATABASE scraparchive;
USE scraparchive;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(32) UNIQUE,
  email VARCHAR(64) UNIQUE,
  password VARCHAR(64),
  salt VARCHAR(64),
  created_at TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE sessions (
  id INT NOT NULL AUTO_INCREMENT,
  hash VARCHAR(64),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  PRIMARY KEY (id)
);

CREATE TABLE buckets (
  id INT NOT NULL AUTO_INCREMENT,
  bucket_id INT,
  FOREIGN KEY (bucket_id) REFERENCES buckets (id),
  PRIMARY KEY (id)
);

CREATE TABLE userbucketpermissions (
  user_id INT,
  bucket_id INT,
  permissionLvl TINYINT, /* 0 - no permission, 1 - read, 2 - read/suggest, 3 - read/write, 4 - read/write/delete, 5 - full admin */
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (bucket_id) REFERENCES buckets (id)
);

CREATE TABLE scraps (
  id INT NOT NULL AUTO_INCREMENT,
  bucket_id INT,
  title VARCHAR(64),
  body TEXT,
  earthdate INT,
  earthtime TIME,
  canon_status TINYINT, /* 0 - not canon, 1 - headcanon, 2 - potential canon, 3 - mostly canon, 4 - canon draft, 5 - confirmed canon */
  FOREIGN KEY (bucket_id) REFERENCES buckets (id),
  PRIMARY KEY (id)
);
