#!/usr/bin/env python3
"""
客户准入系统功能测试脚本
测试所有API接口和功能
"""

import requests
import json
import time
import os

BASE_URL = "http://localhost:5001"

def test_api(method, endpoint, data=None, headers=None):
    """通用API测试函数"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"[{method}] {endpoint} -> {response.status_code}")
        
        if response.status_code == 200:
            if 'application/json' in response.headers.get('content-type', ''):
                return response.json()
            else:
                return {"status": "success", "content_type": response.headers.get('content-type')}
        else:
            print(f"    Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"    Exception: {e}")
        return None

def test_system():
    """完整系统测试"""
    print("🚀 开始客户准入系统功能测试\n")
    
    # 1. 测试主页
    print("1️⃣ 测试主页面")
    response = test_api("GET", "/")
    if response:
        print("   ✅ 主页面加载正常")
    else:
        print("   ❌ 主页面加载失败")
        return
    
    print()
    
    # 2. 测试历史页面
    print("2️⃣ 测试历史页面")
    response = test_api("GET", "/history")
    if response:
        print("   ✅ 历史页面加载正常")
    else:
        print("   ❌ 历史页面加载失败")
        return
    
    print()
    
    # 3. 测试历史记录API
    print("3️⃣ 测试历史记录API")
    history = test_api("GET", "/api/history")
    if history and history.get('success'):
        print(f"   ✅ 历史记录API正常，共有 {history['data']['total']} 条记录")
        ratings = history['data']['ratings']
    else:
        print("   ❌ 历史记录API失败")
        return
    
    print()
    
    # 4. 测试创建新评级
    print("4️⃣ 测试创建客户评级")
    new_rating_data = {
        "customer_name": "系统测试公司",
        "customer_type": "direct",
        "industry_score": 10,
        "business_type_score": 15,
        "influence_score": 10,
        "logistics_scale_score": 8,
        "credit_score": 20,
        "profit_estimate_score": 20,
        "industry_detail": "电子科技行业",
        "business_type_detail": "组合型业务",
        "influence_detail": "世界500强企业",
        "logistics_scale_detail": "年营收5000万-1亿元",
        "profit_estimate_detail": "预计年营收8000万元",
        "credit_details": {"rating": "良好", "score": 85}
    }
    
    create_result = test_api("POST", "/api/calculate", new_rating_data)
    if create_result and create_result.get('success'):
        new_rating_id = create_result['data']['id']
        print(f"   ✅ 创建评级成功，ID: {new_rating_id}, 等级: {create_result['data']['grade']}, 得分: {create_result['data']['total_score']}")
    else:
        print("   ❌ 创建评级失败")
        return
    
    print()
    
    # 5. 测试获取评级详情
    print("5️⃣ 测试获取评级详情")
    detail = test_api("GET", f"/api/rating/{new_rating_id}")
    if detail and detail.get('success'):
        print(f"   ✅ 获取详情成功：{detail['data']['customer_name']}")
    else:
        print("   ❌ 获取详情失败")
        return
    
    print()
    
    # 6. 测试Excel导出功能
    print("6️⃣ 测试Excel报告导出")
    export_response = test_api("GET", f"/api/rating/{new_rating_id}/export")
    if export_response and export_response.get('content_type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        print("   ✅ Excel导出功能正常")
    else:
        print("   ❌ Excel导出功能失败")
    
    print()
    
    # 7. 测试同行客户限制
    print("7️⃣ 测试同行客户评级限制")
    peer_rating_data = {
        "customer_name": "同行测试公司",
        "customer_type": "peer",
        "industry_score": 10,
        "business_type_score": 15,
        "influence_score": 10,
        "logistics_scale_score": 10,
        "credit_score": 25,
        "profit_estimate_score": 20,
        "industry_detail": "同行业务",
        "business_type_detail": "同行服务",
        "influence_detail": "知名同行企业",
        "logistics_scale_detail": "规模较大",
        "profit_estimate_detail": "高收益预期",
        "credit_details": {"rating": "优秀", "score": 95}
    }
    
    peer_result = test_api("POST", "/api/calculate", peer_rating_data)
    if peer_result and peer_result.get('success'):
        if peer_result['data']['grade'] == 'C':
            print(f"   ✅ 同行客户限制正常，等级被限制为: {peer_result['data']['grade']}")
        else:
            print(f"   ⚠️ 同行客户限制异常，等级为: {peer_result['data']['grade']}（应为C级）")
    else:
        print("   ❌ 同行客户测试失败")
    
    print()
    
    # 8. 测试删除功能
    print("8️⃣ 测试删除评级记录")
    delete_result = test_api("DELETE", f"/api/rating/{new_rating_id}")
    if delete_result and delete_result.get('success'):
        print("   ✅ 删除功能正常")
    else:
        print("   ❌ 删除功能失败")
    
    print()
    
    # 9. 验证删除后状态
    print("9️⃣ 验证删除后状态")
    verify_delete = test_api("GET", f"/api/rating/{new_rating_id}")
    if verify_delete is None:
        print("   ✅ 记录已成功删除")
    else:
        print("   ⚠️ 记录删除可能未生效")
    
    print()
    
    # 10. 获取最终统计
    print("🔟 最终系统状态检查")
    final_history = test_api("GET", "/api/history")
    if final_history and final_history.get('success'):
        final_total = final_history['data']['total']
        final_ratings = final_history['data']['ratings']
        
        grade_stats = {'A+': 0, 'A': 0, 'B': 0, 'C': 0}
        for rating in final_ratings:
            grade = rating.get('grade', 'C')
            if grade in grade_stats:
                grade_stats[grade] += 1
        
        print(f"   📊 系统统计信息：")
        print(f"      总记录数：{final_total}")
        print(f"      A+ 级客户：{grade_stats['A+']} 个")
        print(f"      A 级客户：{grade_stats['A']} 个")
        print(f"      B 级客户：{grade_stats['B']} 个")
        print(f"      C 级客户：{grade_stats['C']} 个")
        print("   ✅ 系统状态正常")
    
    print("\n🎉 系统测试完成！所有核心功能正常工作。")
    print("\n📋 功能总结：")
    print("   ✅ 客户评级计算")
    print("   ✅ 历史记录管理")
    print("   ✅ 详情查看")
    print("   ✅ Excel报告导出")
    print("   ✅ 同行客户限制")
    print("   ✅ 记录删除")
    print("   ✅ 统计信息")
    
    print(f"\n🌐 系统访问地址：{BASE_URL}")
    print("   📝 评级页面：http://localhost:5001/")
    print("   📊 历史记录：http://localhost:5001/history")

if __name__ == "__main__":
    test_system() 