-- 客户售前等级评分系统数据库初始化脚本
-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建应用用户（如果不存在）
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON customer_rating_system.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- 选择数据库
USE customer_rating_system;

-- 客户评级表（SQLAlchemy会自动创建，这里只是参考）
-- CREATE TABLE IF NOT EXISTS customer_rating (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     customer_name VARCHAR(200) NOT NULL,
--     customer_type VARCHAR(50) NOT NULL,
--     industry_score INT NOT NULL,
--     business_type_score INT NOT NULL,
--     influence_score INT NOT NULL,
--     customer_type_score INT NOT NULL,
--     logistics_scale_score INT NOT NULL,
--     credit_score INT NOT NULL,
--     profit_estimate_score INT NOT NULL,
--     total_score INT NOT NULL,
--     grade VARCHAR(10) NOT NULL,
--     rating_details TEXT,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_customer_name (customer_name),
--     INDEX idx_grade (grade),
--     INDEX idx_created_at (created_at)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一些测试数据（可选）
-- INSERT INTO customer_rating (
--     customer_name, customer_type, industry_score, business_type_score,
--     influence_score, customer_type_score, logistics_scale_score,
--     credit_score, profit_estimate_score, total_score, grade, rating_details
-- ) VALUES 
-- ('示例客户A', 'direct', 10, 15, 10, 10, 10, 25, 20, 100, 'A+', '{}'),
-- ('示例客户B', 'global', 5, 12, 5, 8, 6, 15, 10, 61, 'C', '{}');

SET FOREIGN_KEY_CHECKS = 1; 