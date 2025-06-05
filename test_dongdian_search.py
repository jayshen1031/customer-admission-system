#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from company_autocomplete_service import CompanyAutocompleteService

def test_dongdian_search():
    service = CompanyAutocompleteService()
    
    print("🔍 测试搜索'东电'...")
    results = service.search_companies('东电', limit=10)
    
    if results:
        print(f"✅ 找到 {len(results)} 个结果:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['name']}")
            print(f"     匹配类型: {result['match_type']}, 分数: {result['score']}")
    else:
        print("❌ 没有找到结果")
    
    print("\n🔍 测试搜索'东京电子'...")
    results2 = service.search_companies('东京电子', limit=10)
    
    if results2:
        print(f"✅ 找到 {len(results2)} 个结果:")
        for i, result in enumerate(results2, 1):
            print(f"  {i}. {result['name']}")
            print(f"     匹配类型: {result['match_type']}, 分数: {result['score']}")
    else:
        print("❌ 没有找到结果")

if __name__ == "__main__":
    test_dongdian_search() 