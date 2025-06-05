# MySQL数据库配置说明

## 1. 安装MySQL依赖

```bash
pip install -r requirements.txt
```

## 2. 创建MySQL数据库

```sql
CREATE DATABASE customer_rating_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. 环境变量配置

在系统中设置以下环境变量，或在启动应用时指定：

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=customer_rating_system
export DB_USER=root
export DB_PASSWORD=your_password_here
```

或者直接设置完整的数据库URL：

```bash
export DATABASE_URL=mysql+pymysql://username:password@localhost:3306/customer_rating_system?charset=utf8mb4
```

## 4. 启动应用

```bash
python app.py
```

## 5. Docker方式运行MySQL（可选）

```bash
docker run --name mysql-customer-rating \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=customer_rating_system \
  -p 3306:3306 \
  -d mysql:8.0
```

## 6. 备用SQLite配置

如果MySQL连接失败，系统会自动使用SQLite作为备用数据库。

## 默认配置值

- DB_HOST: localhost
- DB_PORT: 3306
- DB_NAME: customer_rating_system
- DB_USER: root
- DB_PASSWORD: password（请务必修改） 