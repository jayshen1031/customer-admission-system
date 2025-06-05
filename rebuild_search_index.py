#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from company_autocomplete_service import CompanyAutocompleteService

def rebuild_and_test():
    print("🔄 重建搜索索引...")
    service = CompanyAutocompleteService()
    
    # 检查东京电子相关企业是否在数据库中
    dongdian_companies = [name for name in service.company_database if '东京电子' in name]
    print(f"📋 数据库中包含'东京电子'的企业: {len(dongdian_companies)}")
    for company in dongdian_companies:
        print(f"  - {company}")
    
    # 检查搜索索引中的"东电"关键词
    print("\n🔍 检查搜索索引中的'东电'关键词...")
    if '东电' in service.search_index:
        companies = service.search_index['东电']
        print(f"  关键词'东电'对应的企业: {len(companies)}")
        for company in companies:
            print(f"    - {company}")
    else:
        print("  ❌ 搜索索引中没有'东电'关键词")
    
    # 手动检查关键词提取
    if dongdian_companies:
        test_company = dongdian_companies[0]
        keywords = service._extract_keywords(test_company)
        print(f"\n🔑 '{test_company}' 提取的关键词:")
        print(f"  {keywords}")
    
    # 重建索引
    print("\n🔄 重新构建搜索索引...")
    service._build_search_index()
    
    # 再次检查
    print("\n🔍 重建后检查搜索索引中的'东电'关键词...")
    if '东电' in service.search_index:
        companies = service.search_index['东电']
        print(f"  关键词'东电'对应的企业: {len(companies)}")
        for company in companies:
            print(f"    - {company}")
    else:
        print("  ❌ 重建后搜索索引中仍然没有'东电'关键词")
    
    # 测试搜索
    print("\n🔍 测试搜索'东电'...")
    results = service.search_companies('东电', limit=10)
    
    if results:
        print(f"✅ 找到 {len(results)} 个结果:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['name']}")
            print(f"     匹配类型: {result['match_type']}, 分数: {result['score']}")
    else:
        print("❌ 没有找到结果")
    
    # 测试拼音搜索
    print("\n🔍 测试拼音搜索'dongdian'...")
    results2 = service.search_companies('dongdian', limit=10)
    
    if results2:
        print(f"✅ 找到 {len(results2)} 个结果:")
        for i, result in enumerate(results2, 1):
            print(f"  {i}. {result['name']}")
            print(f"     匹配类型: {result['match_type']}, 分数: {result['score']}")
    else:
        print("❌ 没有找到结果")

if __name__ == "__main__":
    rebuild_and_test() 