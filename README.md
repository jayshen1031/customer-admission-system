# 客户售前等级评分系统 v2.0

一个完整的客户评级与准入管理系统，提供多维度评估、智能评级计算、Excel报告导出等功能。

## 🌟 系统特色

### 📊 智能评级算法
- **多维度评估**：7个核心维度，100分制科学评分
- **权重分配**：按照业务重要性合理分配权重
- **智能分级**：A+/A/B/C四级评定，清晰区分客户价值
- **风险控制**：同行客户自动限制为C级，防范业务风险

### 📈 评分维度详解

| 评估维度 | 权重 | 评分标准 | 说明 |
|---------|------|----------|------|
| 行业评分 | 10% | 战略行业10分，非战略行业5分 | 电子科技/半导体/汽车等优先 |
| 业务类型 | 15% | 组合型15分，非组合型12分 | 多元化业务降低风险 |
| 客户影响力 | 10% | 500强10分，民企500强8分，其他5分 | 知名度影响合作价值 |
| 客户类型 | 10% | 直接10分，Global同行8分，海外代理6分，同行0分 | 合作模式影响 |
| 客户规模 | 10% | ≥1亿10分，5000万-1亿8分，1000万-5000万6分，<1000万4分 | 规模决定合作潜力 |
| 资信评估 | 25% | 优秀25分，良好20分，一般15分，较差10分 | 信用状况最重要 |
| 商机预估 | 20% | ≥1亿营收20分，≥100万毛利10分，≥60万毛利5分，≥12万毛利2分 | 收益预期 |

### 🏆 评级标准

| 等级 | 分数范围 | 建议动作 |
|------|----------|----------|
| **A+** | ≥90分 | 优先合作，最高优先级 |
| **A** | 80-89分 | 建议加强合作关系 |
| **B** | 70-79分 | 需要谨慎评估风险 |
| **C** | 60-69分 | 需要领导审批决策 |
| **D** | <60分 | 不建议合作 |

## 🔧 技术架构

### 后端技术栈
- **框架**：Flask 2.3.3 - 轻量级Web框架
- **数据库**：SQLAlchemy + MySQL/SQLite - 支持MySQL生产环境和SQLite开发环境
- **MySQL驱动**：PyMySQL 1.1.1 - 纯Python MySQL驱动
- **报告生成**：XlsxWriter 3.1.9 - 专业Excel报告
- **API设计**：RESTful API - 标准化接口

### 前端技术栈
- **UI框架**：Bootstrap 5.3.0 - 现代响应式设计
- **图标库**：Bootstrap Icons 1.10.0 - 丰富图标支持
- **交互逻辑**：原生JavaScript - 轻量级无依赖
- **用户体验**：Toast通知、模态框、响应式布局

### 数据模型
```sql
CustomerRating {
    id: 主键ID
    customer_name: 客户名称
    customer_type: 客户类型
    industry_score: 行业评分
    business_type_score: 业务类型评分
    influence_score: 客户影响力评分
    customer_type_score: 客户类型评分
    logistics_scale_score: 客户规模评分
    credit_score: 资信评估评分
    profit_estimate_score: 商机预估评分
    total_score: 总分
    grade: 客户等级
    rating_details: 评级详情(JSON)
    created_at: 创建时间
}
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- pip 包管理器
- MySQL 5.7+ (生产环境推荐) 或 SQLite (开发环境)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd 客户售前等级评分系统
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置数据库（可选）**

**MySQL配置（生产环境推荐）：**
```bash
# 设置环境变量
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=customer_rating_system
export DB_USER=root
export DB_PASSWORD=your_password

# 或设置完整数据库URL
export DATABASE_URL=mysql+pymysql://username:password@localhost:3306/customer_rating_system?charset=utf8mb4
```

**创建MySQL数据库：**
```sql
CREATE DATABASE customer_rating_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**SQLite配置（默认）：**
如果未配置MySQL，系统会自动使用SQLite数据库，无需额外配置。

4. **启动系统**
```bash
python app.py
```

4. **访问系统**
- 主页面：http://localhost:5001/
- 历史记录：http://localhost:5001/history

### Docker部署（可选）

```bash
# 构建镜像
docker build -t customer-rating-system .

# 运行容器
docker-compose up -d
```

## 📱 功能模块

### 1. 客户评级模块
**页面路径**：`/`

**核心功能**：
- ✅ 智能表单验证
- ✅ 实时评分计算
- ✅ 同行客户限制
- ✅ 评级结果展示
- ✅ 历史记录链接

**使用流程**：
1. 填写客户基本信息
2. 选择各维度评分
3. 系统自动计算总分
4. 展示评级结果和建议

### 2. 历史记录模块
**页面路径**：`/history`

**核心功能**：
- ✅ 分页浏览历史记录
- ✅ 统计信息仪表板
- ✅ 详细信息查看
- ✅ Excel报告导出
- ✅ 批量导出功能
- ✅ 记录删除管理

**操作指南**：
- **查看详情**：点击👁️按钮查看完整评级信息
- **导出报告**：点击📥按钮下载Excel详细报告
- **删除记录**：点击🗑️按钮删除不需要的记录
- **批量导出**：点击"批量导出"按钮下载所有报告

### 3. Excel报告模块
**访问方式**：历史记录页面导出按钮

**报告内容**：
- 📋 客户基本信息
- 📊 综合评级结果
- 📈 详细评分明细
- 📝 评级结论建议
- 🏷️ 评级标准说明
- ⏰ 系统生成时间

**报告特色**：
- 专业Excel格式
- 精美排版设计
- 完整评级信息
- 可打印布局

## 🔌 API接口

### 评级计算接口
```http
POST /api/calculate
Content-Type: application/json

{
    "customer_name": "客户名称",
    "customer_type": "direct|global|overseas|peer",
    "industry_score": 10,
    "business_type_score": 15,
    "influence_score": 10,
    "logistics_scale_score": 8,
    "credit_score": 20,
    "profit_estimate_score": 20,
    "industry_detail": "行业详情",
    "business_type_detail": "业务类型详情",
    "influence_detail": "影响力详情",
    "logistics_scale_detail": "规模详情",
    "profit_estimate_detail": "商机详情",
    "credit_details": {"rating": "良好", "score": 85}
}
```

### 历史记录接口
```http
GET /api/history?page=1&per_page=10
```

### 评级详情接口
```http
GET /api/rating/{id}
```

### 报告导出接口
```http
GET /api/rating/{id}/export
```

### 删除记录接口
```http
DELETE /api/rating/{id}
```

## 🧪 测试功能

系统提供了完整的自动化测试脚本：

```bash
python test_system.py
```

**测试覆盖**：
- ✅ 页面加载测试
- ✅ API接口测试
- ✅ 评级计算测试
- ✅ Excel导出测试
- ✅ 同行限制测试
- ✅ 删除功能测试
- ✅ 数据完整性验证

## 📋 使用案例

### 案例1：A+级优质客户
```
客户：华为技术有限公司
类型：直接客户
行业：电子科技（10分）
业务：组合型业务（15分）
影响力：世界500强（10分）
类型评分：直接客户（10分）
规模：年营收>1亿（10分）
资信：优秀（25分）
商机：>1亿营收（20分）
总分：100分 → A+级
```

### 案例2：同行客户限制
```
客户：顺丰控股股份有限公司
类型：同行客户
实际评分：95分
系统限制：C级（同行客户最高C级）
风险提示：需要特别审批
```

### 案例3：B级谨慎客户
```
客户：某中小企业
类型：海外代理客户
行业：非战略行业（5分）
业务：单一业务（12分）
影响力：其他企业（5分）
类型评分：海外代理（6分）
规模：1000万-5000万（6分）
资信：一般（15分）
商机：60万毛利（5分）
总分：54分 → C级
建议：高风险，需领导审批
```

## 🛡️ 安全特性

- ✅ **输入验证**：前后端双重数据验证
- ✅ **SQL注入防护**：使用ORM框架防止注入
- ✅ **文件安全**：Excel文件内存生成，不存储临时文件
- ✅ **权限控制**：API接口访问控制
- ✅ **数据备份**：SQLite数据库文件可随时备份

## 📊 性能优化

- ✅ **轻量级设计**：SQLite数据库，无额外依赖
- ✅ **内存优化**：Excel文件内存生成，不占用磁盘
- ✅ **分页加载**：历史记录分页减少内存占用
- ✅ **异步处理**：前端异步请求提升用户体验
- ✅ **缓存优化**：静态资源缓存加速页面加载

## 🔧 系统配置

### 应用配置
```python
# app.py 中的配置项
DEBUG = True  # 开发模式
HOST = '0.0.0.0'  # 监听地址
PORT = 5001  # 监听端口（避免与macOS AirPlay冲突）
DATABASE_URL = 'sqlite:///customer_rating.db'  # 数据库地址
```

### 数据库配置
```python
SQLALCHEMY_DATABASE_URI = 'sqlite:///customer_rating.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False
```

## 🆘 故障排查

### 常见问题

**Q: 端口5000被占用怎么办？**
A: 系统默认使用5001端口，如果仍有冲突可在app.py中修改PORT配置。

**Q: Excel导出失败怎么办？**
A: 确保已安装xlsxwriter库：`pip install xlsxwriter==3.1.9`

**Q: 数据库文件在哪里？**
A: 数据库文件为`customer_rating.db`，位于项目根目录。

**Q: 如何备份数据？**
A: 直接复制`customer_rating.db`文件即可完成数据备份。

**Q: 如何重置系统？**
A: 删除`customer_rating.db`文件，重启应用即可重新初始化。

### 日志查看
系统运行日志会在终端实时显示，包括：
- HTTP请求日志
- 错误异常信息
- 数据库操作记录

## 🔄 版本更新

### v2.0 新增功能
- ✨ **Excel报告导出**：专业格式评级报告
- ✨ **批量导出功能**：一键导出所有记录
- ✨ **统计信息仪表板**：直观的数据统计
- ✨ **增强的历史记录页面**：更好的用户体验
- ✨ **详细信息模态框**：完整的评级信息展示
- ✨ **Toast通知系统**：操作反馈提升
- ✨ **响应式设计优化**：更好的移动端支持

### v1.0 基础功能
- ✅ 客户评级计算
- ✅ 历史记录管理
- ✅ 基础数据存储
- ✅ 简单的Web界面

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- 📧 邮箱：jayshen1031@gmail.com
- 🐛 Bug报告：通过GitHub Issues
- 💬 技术交流：项目讨论区

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**客户售前等级评分系统 v2.0** - 专业的客户评级与风险管控解决方案 🚀