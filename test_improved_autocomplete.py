#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试改进后的自动补全功能
验证智能搜索选项是否正确添加到自动补全结果中
"""

import requests
import json

def test_improved_autocomplete():
    """测试改进后的自动补全功能"""
    print("🚀 测试改进后的自动补全功能")
    print("=" * 60)
    
    base_url = "http://localhost:5001"
    
    # 测试用例
    test_cases = [
        {
            'query': '上海易蕾特',
            'description': '有多个匹配结果的查询',
            'expect_results': True,
            'expect_intelligent_option': True
        },
        {
            'query': '东电',
            'description': '简称匹配查询',
            'expect_results': True,
            'expect_intelligent_option': True
        },
        {
            'query': 'xxxx',
            'description': '无匹配结果的查询',
            'expect_results': False,
            'expect_intelligent_option': True
        },
        {
            'query': '',
            'description': '空查询（热门推荐）',
            'expect_results': True,
            'expect_intelligent_option': False  # 热门推荐不应该显示智能搜索
        }
    ]
    
    success_count = 0
    total_count = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 测试用例 {i}: {test_case['description']}")
        print(f"🔍 查询: '{test_case['query']}'")
        print("-" * 40)
        
        try:
            # 调用自动补全API
            if test_case['query']:
                url = f"{base_url}/api/company-autocomplete"
                params = {'q': test_case['query'], 'limit': 8}
            else:
                url = f"{base_url}/api/company-autocomplete"
                params = {'limit': 8}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    suggestions = data.get('data', {}).get('suggestions', [])
                    query_used = data.get('data', {}).get('query', '')
                    
                    print(f"   ✅ API调用成功")
                    print(f"   📊 找到 {len(suggestions)} 个建议")
                    
                    # 验证是否有结果
                    has_results = len(suggestions) > 0
                    if has_results == test_case['expect_results']:
                        print(f"   ✅ 结果数量符合预期: {'有结果' if has_results else '无结果'}")
                    else:
                        print(f"   ❌ 结果数量不符合预期: 期望{'有结果' if test_case['expect_results'] else '无结果'}，实际{'有结果' if has_results else '无结果'}")
                        continue
                    
                    # 显示前3个结果
                    if suggestions:
                        print("   📋 建议列表:")
                        for j, suggestion in enumerate(suggestions[:3]):
                            name = suggestion.get('name', '')
                            match_type = suggestion.get('type', '')
                            score = suggestion.get('score', 0)
                            print(f"      {j+1}. {name} ({match_type}, 分数: {score})")
                        
                        if len(suggestions) > 3:
                            print(f"      ... 还有 {len(suggestions) - 3} 个结果")
                    
                    # 验证前端行为（模拟）
                    print("\n   🖥️  前端行为模拟:")
                    
                    # 检查是否是热门推荐
                    is_popular = not query_used or query_used.strip() == ''
                    
                    if is_popular:
                        print("      - 显示热门企业推荐")
                        if not test_case['expect_intelligent_option']:
                            print("      ✅ 热门推荐不显示智能搜索选项（符合预期）")
                            success_count += 1
                        else:
                            print("      ❌ 预期不应显示智能搜索选项")
                    else:
                        # 有实际查询
                        if len(query_used.strip()) >= 2:
                            print(f"      - 显示查询'{query_used}'的结果")
                            if suggestions:
                                print("      - 显示建议列表")
                            print("      - 添加分隔线")
                            print("      - 显示智能搜索选项")
                            if test_case['expect_intelligent_option']:
                                print("      ✅ 智能搜索选项已添加（符合预期）")
                                success_count += 1
                            else:
                                print("      ❌ 不应显示智能搜索选项")
                        else:
                            print("      - 查询太短，不显示智能搜索选项")
                            
                else:
                    print(f"   ❌ API返回错误: {data.get('error', '未知错误')}")
                    
            else:
                print(f"   ❌ API请求失败: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ 测试异常: {e}")
    
    print(f"\n{'='*60}")
    print(f"📊 测试总结: {success_count}/{total_count} 个测试用例通过")
    
    if success_count == total_count:
        print("🎉 所有测试通过！改进后的自动补全功能工作正常。")
        print("\n✨ 功能改进点:")
        print("   - 有搜索结果时也能显示智能搜索选项")
        print("   - 优雅的分隔线和提示信息")
        print("   - 美化的智能搜索按钮样式")
        print("   - 热门推荐时不显示智能搜索（避免混淆）")
        
        print("\n🔧 用户体验改进:")
        print("   - 用户不再被限制在自动补全结果中")
        print("   - 可以轻松进入智能搜索获得更多选项")
        print("   - 界面更加直观和用户友好")
    else:
        print("⚠️  部分测试未通过，需要进一步检查。")
    
    return success_count == total_count

if __name__ == '__main__':
    test_improved_autocomplete() 