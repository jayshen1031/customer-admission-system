# 外部数据集成功能说明

## 🚀 功能概述

本分支实现了客户准入系统与外部企业数据源的集成，支持自动获取企业工商信息并填充资信评分表，大大提高了评分效率和数据准确性。

## 📊 数据源

### 免费API接口
1. **主要数据源**: `http://42.193.122.222:8600/power_enterprise/get-enterprise-full-info`
   - 支持企业名称查询
   - 限制：每分钟5次请求
   - 返回：企业基本信息、股东信息、投资企业等

2. **备用数据源**: `http://39.106.33.248:8088/businesslicenseVerificationDetailed`
   - POST请求方式
   - 限制：每分钟10次请求

### 官方数据源（参考）
- 国家企业信用信息公示系统: https://www.gsxt.gov.cn/
- 统一社会信用代码查询: https://www.cods.org.cn/
- 中国政府网企业服务: https://www.gov.cn/fuwu/qiye/

## 🛠️ 技术架构

### 核心组件
1. **ExternalDataService类** (`external_data_service.py`)
   - 多数据源管理
   - 速率限制控制
   - 智能数据映射
   - 错误处理和重试机制

2. **Flask API端点** (`app.py`)
   - `/api/external-company-data`: 获取企业数据
   - `/api/test-external-api`: 测试API连接

3. **前端集成** (`templates/index.html`, `static/js/app.js`)
   - 智能数据获取界面
   - 自动填充资信评分表
   - 实时状态反馈

### 数据流程
```
用户输入企业名称 → 调用外部API → 数据解析和清洗 → 映射到评分表 → 自动计算评分
```

## 📋 支持的数据字段

### 企业基本信息
- 企业名称
- 法人代表
- 注册资本
- 实缴资本
- 成立日期
- 经营状态
- 统一社会信用代码
- 注册地址
- 行业类型
- 经营范围

### 资信评分映射
- **企业性质**: 根据企业名称智能判断（国有/合资/民营等）
- **注册资本**: 自动分级（≥1亿/1000万-1亿/500万-1000万/<500万）
- **成立年限**: 自动计算（≥10年/2-10年/<2年）
- **信用记录**: 默认良好状态（可扩展接入征信数据）

## 🎯 使用方法

### 1. 在资信评分表中使用
1. 点击"填写资信评分表"按钮
2. 在"智能数据获取"区域输入企业名称
3. 点击"自动获取"按钮
4. 系统自动填充评分表并计算评分

### 2. API调用方式
```bash
# 测试API连接
curl -X GET http://localhost:5001/api/test-external-api

# 获取企业数据
curl -X POST http://localhost:5001/api/external-company-data \
  -H "Content-Type: application/json" \
  -d '{"company_name":"小米科技有限责任公司"}'
```

### 3. 本地测试
```bash
# 运行测试脚本
python test_external_api.py

# 选择测试模式
1. 批量测试多个企业
2. 测试单个企业
```

## 📈 评分映射规则

### 企业性质评分
- 国有企业: 10分
- 合资企业/独资企业: 8分
- 民营企业/私营企业: 6分
- 其他: 3分

### 注册资本评分
- ≥1亿元: 10分
- 1000万-1亿元: 8分
- 500万-1000万元: 6分
- <500万元: 3分

### 成立年限评分
- ≥10年: 5分
- 2-10年: 3分
- <2年: 1分

### 信用记录评分
- 无失信记录: 6分
- 无工商处罚记录: 8分
- 付款信用良好: 4分
- 同行评价良好: 2分

## 🔧 配置说明

### 速率限制
- 免费API 1: 每分钟5次请求
- 备用API: 每分钟10次请求
- 自动重试机制

### 错误处理
- 网络超时: 10秒
- API失败自动切换备用数据源
- 友好的错误提示信息

## 🚀 部署要求

### Python依赖
```
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
XlsxWriter==3.1.6
requests==2.31.0
```

### 安装依赖
```bash
pip install -r requirements.txt
```

## 🔮 扩展计划

### 数据源扩展
- [ ] 天眼查API集成
- [ ] 企查查API集成
- [ ] 启信宝API集成
- [ ] 央行征信数据接入

### 功能增强
- [ ] 数据缓存机制
- [ ] 数据质量评分
- [ ] 历史数据对比
- [ ] 批量企业数据导入

### AI增强
- [ ] 企业风险评估模型
- [ ] 行业对比分析
- [ ] 智能评分建议

## 📝 注意事项

1. **数据准确性**: 外部API数据仅供参考，建议结合官方渠道验证
2. **API限制**: 免费API有请求频率限制，商用建议购买付费服务
3. **数据隐私**: 遵守相关法律法规，保护企业信息安全
4. **网络依赖**: 功能依赖外部网络，离线环境下需手动填写

## 🎉 测试结果

✅ API连接正常  
✅ 数据获取成功  
✅ 评分映射正确  
✅ 前端集成完成  
✅ 错误处理健全  

系统已可用于生产环境！ 