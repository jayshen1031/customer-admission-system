#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
智能数据补充功能测试脚本
测试当搜索不到企业时，系统自动补充相关企业数据的功能
"""

import requests
import time
import json

def test_intelligent_supplement():
    """测试智能数据补充功能"""
    base_url = "http://127.0.0.1:5001"
    
    print("🧪 开始测试智能数据补充功能...")
    print("=" * 50)
    
    # 测试用例：搜索一个不存在的企业
    test_cases = [
        {
            "query": "测试企业ABC",
            "description": "搜索一个完全不存在的企业名称"
        },
        {
            "query": "长鑫存储",
            "description": "搜索半导体企业（应该能找到相关企业）"
        },
        {
            "query": "中芯国际",
            "description": "搜索知名半导体企业"
        },
        {
            "query": "应用材料",
            "description": "搜索半导体设备企业"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        query = test_case["query"]
        description = test_case["description"]
        
        print(f"\n📋 测试用例 {i}: {description}")
        print(f"🔍 搜索关键词: '{query}'")
        print("-" * 30)
        
        # 1. 首先测试自动补全API
        print("1️⃣ 测试自动补全API...")
        autocomplete_url = f"{base_url}/api/company-autocomplete"
        params = {"q": query, "limit": 5}
        
        try:
            response = requests.get(autocomplete_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('suggestions'):
                    suggestions = data['data']['suggestions']
                    print(f"   ✅ 自动补全找到 {len(suggestions)} 个建议:")
                    for suggestion in suggestions[:3]:
                        print(f"      - {suggestion['name']} ({suggestion['type']})")
                else:
                    print("   ❌ 自动补全未找到结果")
            else:
                print(f"   ❌ 自动补全API请求失败: {response.status_code}")
        except Exception as e:
            print(f"   ❌ 自动补全API请求异常: {e}")
        
        # 2. 测试智能搜索API
        print("\n2️⃣ 测试智能搜索API...")
        intelligent_search_url = f"{base_url}/api/intelligent-search"
        payload = {"query": query, "page": 1}
        
        try:
            response = requests.post(
                intelligent_search_url, 
                json=payload, 
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    if data.get('data', {}).get('supplement_triggered'):
                        # 触发了数据补充
                        supplement_data = data['data']
                        estimated_time = supplement_data.get('estimated_time', 0)
                        message = supplement_data.get('message', '')
                        
                        print(f"   🔄 触发了智能数据补充!")
                        print(f"   ⏱️  预计时间: {estimated_time} 秒")
                        print(f"   💬 提示信息: {message}")
                        
                        # 等待数据补充完成
                        print(f"   ⏳ 等待 {estimated_time + 2} 秒后检查补充状态...")
                        time.sleep(estimated_time + 2)
                        
                        # 检查补充状态
                        print("   🔍 检查数据补充状态...")
                        status_url = f"{base_url}/api/data-supplement-status"
                        status_params = {"query": query}
                        
                        status_response = requests.get(status_url, params=status_params, timeout=10)
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            if status_data.get('success'):
                                has_new_results = status_data.get('data', {}).get('has_new_results', False)
                                results_count = status_data.get('data', {}).get('results_count', 0)
                                
                                if has_new_results:
                                    print(f"   ✅ 数据补充成功! 找到 {results_count} 个相关企业")
                                    
                                    # 重新搜索验证
                                    print("   🔄 重新执行智能搜索验证...")
                                    verify_response = requests.post(
                                        intelligent_search_url, 
                                        json=payload, 
                                        headers={"Content-Type": "application/json"},
                                        timeout=10
                                    )
                                    
                                    if verify_response.status_code == 200:
                                        verify_data = verify_response.json()
                                        if verify_data.get('success') and verify_data.get('data', {}).get('results'):
                                            results = verify_data['data']['results']
                                            print(f"   ✅ 验证成功! 现在能找到 {len(results)} 个相关企业:")
                                            for result in results[:3]:
                                                print(f"      - {result['name']} (相似度: {result['score']}%)")
                                        else:
                                            print("   ❌ 验证失败: 重新搜索仍无结果")
                                    else:
                                        print(f"   ❌ 验证搜索失败: {verify_response.status_code}")
                                else:
                                    print("   ⏳ 数据补充仍在进行中或未找到相关企业")
                            else:
                                print(f"   ❌ 状态检查失败: {status_data.get('error', '未知错误')}")
                        else:
                            print(f"   ❌ 状态检查请求失败: {status_response.status_code}")
                    
                    elif data.get('data', {}).get('results'):
                        # 直接找到了结果
                        results = data['data']['results']
                        print(f"   ✅ 直接找到 {len(results)} 个相关企业:")
                        for result in results[:3]:
                            print(f"      - {result['name']} (相似度: {result['score']}%)")
                    else:
                        print("   ❌ 未找到结果且未触发数据补充")
                else:
                    print(f"   ❌ 智能搜索失败: {data.get('error', '未知错误')}")
            else:
                print(f"   ❌ 智能搜索API请求失败: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ 智能搜索API请求异常: {e}")
        
        print("\n" + "=" * 50)
    
    print("\n🎉 智能数据补充功能测试完成!")

if __name__ == "__main__":
    test_intelligent_supplement() 