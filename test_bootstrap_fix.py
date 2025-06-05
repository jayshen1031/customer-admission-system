#!/usr/bin/env python3
"""
测试Bootstrap修复功能
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5001"

def test_bootstrap_functionality():
    """测试Bootstrap相关功能是否正常"""
    print("🔧 测试Bootstrap修复功能...")
    
    # 1. 测试历史页面加载
    print("\n1. 测试历史页面访问...")
    response = requests.get(f"{BASE_URL}/history")
    assert response.status_code == 200, f"历史页面访问失败: {response.status_code}"
    print("   ✅ 历史页面加载正常")
    
    # 2. 检查JavaScript文件包含修复代码
    print("\n2. 检查JavaScript修复代码...")
    response = requests.get(f"{BASE_URL}/static/js/history.js")
    js_content = response.text
    
    # 检查新增的安全函数
    required_functions = [
        'waitForBootstrap',
        'showModal',
        'hideModal', 
        'showBootstrapToast'
    ]
    
    for func in required_functions:
        assert func in js_content, f"缺少函数: {func}"
        print(f"   ✅ 函数 {func} 存在")
    
    # 检查是否包含错误处理
    assert 'try {' in js_content and 'catch (error)' in js_content, "缺少错误处理"
    print("   ✅ 包含错误处理机制")
    
    # 检查是否包含Bootstrap等待机制
    assert 'typeof bootstrap' in js_content, "缺少Bootstrap检查机制"
    print("   ✅ 包含Bootstrap等待机制")
    
    # 3. 创建测试记录
    print("\n3. 创建测试记录...")
    test_data = {
        "customer_name": "Bootstrap测试公司",
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
    assert result.get('success'), f"创建记录失败: {result.get('error')}"
    
    rating_id = result['data']['id']
    print(f"   ✅ 创建测试记录成功 (ID: {rating_id})")
    
    # 4. 测试详情API (这会触发模态框)
    print("\n4. 测试详情API...")
    response = requests.get(f"{BASE_URL}/api/rating/{rating_id}")
    detail_result = response.json()
    assert detail_result.get('success'), f"获取详情失败: {detail_result.get('error')}"
    print("   ✅ 详情API正常返回数据")
    
    # 5. 测试导出功能
    print("\n5. 测试导出功能...")
    response = requests.get(f"{BASE_URL}/api/rating/{rating_id}/export")
    assert response.status_code == 200, f"导出失败: {response.status_code}"
    print(f"   ✅ 导出功能正常 (文件大小: {len(response.content)} bytes)")
    
    # 6. 检查页面HTML结构
    print("\n6. 验证页面HTML结构...")
    response = requests.get(f"{BASE_URL}/history")
    html_content = response.text
    
    # 检查Bootstrap CSS和JS是否正确加载
    assert 'bootstrap@5.3.0/dist/css/bootstrap.min.css' in html_content, "Bootstrap CSS未加载"
    assert 'bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js' in html_content, "Bootstrap JS未加载"
    print("   ✅ Bootstrap资源正确加载")
    
    # 检查模态框结构
    assert 'id="detailModal"' in html_content, "详情模态框结构缺失"
    assert 'id="deleteModal"' in html_content, "删除模态框结构缺失"
    assert 'id="toastNotification"' in html_content, "Toast通知结构缺失"
    print("   ✅ 页面模态框结构完整")
    
    # 7. 清理测试数据
    print("\n7. 清理测试数据...")
    response = requests.delete(f"{BASE_URL}/api/rating/{rating_id}")
    if response.status_code == 200:
        print(f"   ✅ 清理测试记录成功")
    
    print("\n🎉 Bootstrap修复测试全部通过！")
    print("\n📋 修复内容总结:")
    print("   ✅ 添加Bootstrap加载等待机制")
    print("   ✅ 实现安全的模态框显示/隐藏")
    print("   ✅ 实现安全的Toast通知显示")
    print("   ✅ 添加完善的错误处理机制")
    print("   ✅ 提供原生alert作为后备方案")

def main():
    """主函数"""
    try:
        # 检查服务器是否运行
        response = requests.get(f"{BASE_URL}/", timeout=3)
        if response.status_code != 200:
            print("❌ 服务器未运行或无法访问")
            return
        
        test_bootstrap_functionality()
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保 Flask 应用正在运行")
        print("   运行命令: python app.py")
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 