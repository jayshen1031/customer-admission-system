import requests
import json

BASE_URL = "http://127.0.0.1:5001"

print("🚀 测试增强的历史页面功能...")

# 1. 测试历史页面
response = requests.get(f"{BASE_URL}/history")
print(f"历史页面状态: {response.status_code}")

# 2. 创建一个测试记录
test_data = {
    "customer_name": "测试公司",
    "customer_type": "direct",
    "industry_score": 10,
    "business_type_score": 15,
    "influence_score": 10,
    "logistics_scale_score": 10,
    "credit_score": 25,
    "profit_estimate_score": 20
}

response = requests.post(f"{BASE_URL}/api/calculate", json=test_data)
result = response.json()
print(f"创建记录状态: {response.status_code}, 成功: {result.get('success')}")

if result.get('success'):
    rating_id = result['data']['id']
    print(f"创建的记录ID: {rating_id}")
    
    # 3. 测试详情API
    response = requests.get(f"{BASE_URL}/api/rating/{rating_id}")
    detail_result = response.json()
    print(f"详情API状态: {response.status_code}, 成功: {detail_result.get('success')}")
    
    if detail_result.get('success'):
        rating_data = detail_result['data']
        print(f"客户名称: {rating_data['customer_name']}")
        print(f"总分: {rating_data['total_score']}")
        print(f"等级: {rating_data['grade']}")
    
    # 4. 测试Excel导出
    response = requests.get(f"{BASE_URL}/api/rating/{rating_id}/export")
    print(f"Excel导出状态: {response.status_code}")
    print(f"文件大小: {len(response.content)} bytes")

# 5. 检查JavaScript文件
response = requests.get(f"{BASE_URL}/static/js/history.js")
js_content = response.text
print(f"JavaScript文件大小: {len(js_content)} 字符")

# 检查关键功能
functions = ['toggleSelectAll', 'exportSelectedRecords', 'renderDetailModal']
for func in functions:
    exists = func in js_content
    print(f"功能 {func}: {'✅' if exists else '❌'}")

print("✅ 测试完成！") 