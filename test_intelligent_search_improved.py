#!/usr/bin/env python3
"""
测试改进后的智能搜索逻辑
验证多种触发条件
"""

import requests
import time
import json

def test_improved_intelligent_search():
    """测试改进后的智能搜索功能"""
    print("🚀 测试改进后的智能搜索功能\n")
    
    base_url = "http://localhost:5001"
    
    # 测试案例
    test_cases = [
        {
            'name': '完全新的企业查询',
            'query': '神秘科技公司',
            'expected': '应该触发数据补充（没有结果）'
        },
        {
            'name': '具体的企业查询（维斯登光电有）',
            'query': '维斯登光电有',
            'expected': '应该触发数据补充（更具体的查询）'
        },
        {
            'name': '具体的企业查询（维斯登光电技术）',
            'query': '维斯登光电技术',
            'expected': '应该触发数据补充（包含技术关键词）'
        },
        {
            'name': '包含公司后缀的查询',
            'query': '新兴电子有限公司',
            'expected': '应该触发数据补充（包含有限公司后缀）'
        },
        {
            'name': '简短的已知企业查询',
            'query': '东电',
            'expected': '应该直接返回结果（已有匹配）'
        },
        {
            'name': '已知企业的完整查询',
            'query': '长鑫存储技术有限公司',
            'expected': '应该直接返回结果（完全匹配）'
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"📋 测试案例 {i}: {case['name']}")
        print(f"🔍 查询: '{case['query']}'")
        print(f"📝 预期: {case['expected']}")
        
        try:
            # 1. 先测试常规搜索
            print("   1️⃣ 测试常规搜索...")
            response = requests.get(f"{base_url}/api/company-autocomplete", 
                                  params={'q': case['query'], 'limit': 5})
            
            if response.status_code == 200:
                data = response.json()
                results_count = len(data.get('data', {}).get('suggestions', []))
                print(f"   📊 常规搜索结果: {results_count} 个")
                
                if results_count > 0:
                    for j, suggestion in enumerate(data['data']['suggestions'][:3]):
                        print(f"      - {suggestion['name']} (匹配度: {suggestion.get('score', 'N/A')})")
                        if j >= 2:  # 只显示前3个
                            break
            else:
                print(f"   ❌ 常规搜索失败: {response.status_code}")
            
            # 2. 测试智能搜索
            print("   2️⃣ 测试智能搜索...")
            response = requests.post(f"{base_url}/api/intelligent-search",
                                   json={'query': case['query'], 'page': 1})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    search_data = data.get('data', {})
                    
                    if search_data.get('supplement_triggered'):
                        print(f"   ✅ 触发了数据补充")
                        print(f"   ⏱️ 预计时间: {search_data.get('estimated_time')}秒")
                        print(f"   💬 消息: {search_data.get('message')}")
                        
                        # 等待数据补充完成
                        print("   ⏳ 等待数据补充完成...")
                        time.sleep(search_data.get('estimated_time', 5) + 2)
                        
                        # 检查补充状态
                        status_response = requests.get(f"{base_url}/api/data-supplement-status",
                                                     params={'query': case['query']})
                        
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            if status_data.get('success'):
                                status_info = status_data.get('data', {})
                                print(f"   📈 补充结果: {status_info.get('message')}")
                                print(f"   📊 新增结果数: {status_info.get('results_count')}")
                        
                    else:
                        results = search_data.get('results', [])
                        print(f"   📋 直接返回结果: {len(results)} 个")
                        for j, result in enumerate(results[:3]):
                            print(f"      - {result['name']} (相似度: {result.get('score', 'N/A')}%)")
                            if j >= 2:
                                break
                else:
                    print(f"   ❌ 智能搜索失败: {data.get('error')}")
            else:
                print(f"   ❌ 智能搜索请求失败: {response.status_code}")
            
        except Exception as e:
            print(f"   ❌ 测试失败: {e}")
        
        print()  # 空行分隔
        time.sleep(1)  # 防止请求过快
    
    print("🎉 智能搜索测试完成！")

if __name__ == '__main__':
    test_improved_intelligent_search() 