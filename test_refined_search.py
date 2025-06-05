#!/usr/bin/env python3
"""
测试改进后的精确搜索功能
验证"维斯登光电有"等具体查询能够触发智能补充
"""

import requests
import time

def test_refined_search():
    """测试精确搜索功能"""
    print("🚀 测试改进后的精确搜索功能\n")
    
    base_url = "http://localhost:5001"
    
    # 测试场景：用户先搜"维斯登"，然后搜"维斯登光电有"
    test_scenarios = [
        {
            'description': '场景1：用户第一次搜索"维斯登"',
            'query': '维斯登',
            'expected': '触发数据补充，添加基础企业'
        },
        {
            'description': '场景2：用户第二次搜索"维斯登光电有"（更具体）',
            'query': '维斯登光电有',
            'expected': '应该再次触发数据补充，添加更精确的企业'
        },
        {
            'description': '场景3：用户搜索"维斯登光电技术有限公司"（非常具体）',
            'query': '维斯登光电技术有限公司',
            'expected': '应该触发数据补充，添加精确匹配的企业'
        }
    ]
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"{'='*60}")
        print(f"🧪 {scenario['description']}")
        print(f"🔍 查询: '{scenario['query']}'")
        print(f"📝 预期: {scenario['expected']}")
        print(f"{'='*60}")
        
        try:
            # 1. 测试常规搜索
            print("1️⃣ 常规搜索结果:")
            response = requests.get(f"{base_url}/api/company-autocomplete", 
                                  params={'q': scenario['query'], 'limit': 5})
            
            if response.status_code == 200:
                data = response.json()
                suggestions = data.get('data', {}).get('suggestions', [])
                print(f"   📊 找到 {len(suggestions)} 个建议")
                
                for j, suggestion in enumerate(suggestions[:3]):
                    score = suggestion.get('score', 0)
                    print(f"   {j+1}. {suggestion['name']} (匹配度: {score})")
                
                if len(suggestions) == 0:
                    print("   ❌ 没有找到任何结果")
                
            else:
                print(f"   ❌ 常规搜索失败: {response.status_code}")
            
            print()
            
            # 2. 测试智能搜索
            print("2️⃣ 智能搜索测试:")
            response = requests.post(f"{base_url}/api/intelligent-search",
                                   json={'query': scenario['query'], 'page': 1})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    search_data = data.get('data', {})
                    
                    if search_data.get('supplement_triggered'):
                        print("   ✅ 触发了智能数据补充！")
                        print(f"   ⏱️ 预计补充时间: {search_data.get('estimated_time')}秒")
                        print(f"   💬 系统消息: {search_data.get('message')}")
                        
                        # 等待补充完成
                        wait_time = search_data.get('estimated_time', 5) + 2
                        print(f"   ⏳ 等待 {wait_time} 秒让数据补充完成...")
                        time.sleep(wait_time)
                        
                        # 检查补充状态
                        print("   📈 检查数据补充结果:")
                        status_response = requests.get(f"{base_url}/api/data-supplement-status",
                                                     params={'query': scenario['query']})
                        
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            if status_data.get('success'):
                                status_info = status_data.get('data', {})
                                print(f"   📊 补充状态: {status_info.get('message')}")
                                print(f"   🎯 新增企业数: {status_info.get('results_count')}")
                                
                                # 再次搜索验证
                                print("   🔄 验证补充效果 - 再次搜索:")
                                verify_response = requests.get(f"{base_url}/api/company-autocomplete", 
                                                            params={'q': scenario['query'], 'limit': 5})
                                
                                if verify_response.status_code == 200:
                                    verify_data = verify_response.json()
                                    new_suggestions = verify_data.get('data', {}).get('suggestions', [])
                                    print(f"   📊 补充后找到 {len(new_suggestions)} 个建议")
                                    
                                    for k, suggestion in enumerate(new_suggestions[:3]):
                                        score = suggestion.get('score', 0)
                                        print(f"   {k+1}. {suggestion['name']} (匹配度: {score})")
                            else:
                                print("   ❌ 获取补充状态失败")
                        else:
                            print("   ❌ 补充状态检查请求失败")
                    
                    else:
                        results = search_data.get('results', [])
                        print(f"   📋 直接返回 {len(results)} 个搜索结果（未触发补充）")
                        for k, result in enumerate(results[:3]):
                            score = result.get('score', 0)
                            print(f"   {k+1}. {result['name']} (相似度: {score}%)")
                        
                        if len(results) == 0:
                            print("   ⚠️ 没有返回任何结果，但也未触发补充")
                else:
                    print(f"   ❌ 智能搜索失败: {data.get('error')}")
            else:
                print(f"   ❌ 智能搜索请求失败: {response.status_code}")
            
        except Exception as e:
            print(f"   ❌ 测试失败: {e}")
        
        print("\n" + "="*60 + "\n")
        time.sleep(2)  # 间隔一下，避免请求过快
    
    print("🎉 精确搜索功能测试完成！")
    print("\n📋 测试总结:")
    print("- 第一次搜索'维斯登'应该触发基础数据补充")
    print("- 第二次搜索'维斯登光电有'应该触发更精确的数据补充")
    print("- 系统应该能识别用户查询的具体程度并相应补充数据")

if __name__ == '__main__':
    test_refined_search() 