#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from company_autocomplete_service import CompanyAutocompleteService

def debug_search():
    service = CompanyAutocompleteService()
    query = "东电"
    
    print(f"🔍 调试搜索 '{query}'...")
    print("=" * 50)
    
    # 1. 检查拼音匹配
    print("1️⃣ 拼音匹配:")
    query_lower = query.lower()
    found_pinyin = False
    for pinyin, chinese in service.pinyin_mapping.items():
        if query_lower == pinyin or query_lower in pinyin:
            print(f"  匹配拼音: {pinyin} -> {chinese}")
            # 检查是否有包含这个中文的企业
            for company in service.company_database:
                if chinese in company:
                    print(f"    找到企业: {company}")
                    found_pinyin = True
    if not found_pinyin:
        print("  ❌ 无拼音匹配")
    
    # 2. 检查精确匹配
    print("\n2️⃣ 精确匹配:")
    found_exact = False
    for company in service.company_database:
        if query in company:
            print(f"  找到企业: {company}")
            found_exact = True
    if not found_exact:
        print("  ❌ 无精确匹配")
    
    # 3. 检查关键词匹配
    print("\n3️⃣ 关键词匹配:")
    print(f"  搜索索引总数: {len(service.search_index)}")
    
    # 查找包含"东电"的关键词
    dongdian_keywords = [k for k in service.search_index.keys() if query in k or k == query]
    print(f"  包含'{query}'的关键词: {dongdian_keywords}")
    
    found_keyword = False
    for keyword, companies in service.search_index.items():
        if query == keyword or query in keyword:
            print(f"  匹配关键词: '{keyword}' -> {len(companies)} 企业")
            for company in companies:
                score = service._calculate_match_score(query, company)
                print(f"    企业: {company} (分数: {score})")
                if score > 30:
                    print(f"      ✅ 分数合格 (>{30})")
                    found_keyword = True
                else:
                    print(f"      ❌ 分数不合格 (<={30})")
    
    if not found_keyword:
        print("  ❌ 无关键词匹配")
    
    # 4. 检查模糊匹配
    print("\n4️⃣ 模糊匹配:")
    import difflib
    fuzzy_matches = []
    for company in service.company_database:
        similarity = difflib.SequenceMatcher(None, query.lower(), company.lower()).ratio()
        if similarity > 0.3:
            fuzzy_matches.append((company, similarity))
    
    fuzzy_matches.sort(key=lambda x: x[1], reverse=True)
    if fuzzy_matches:
        print(f"  找到 {len(fuzzy_matches)} 个模糊匹配:")
        for company, similarity in fuzzy_matches[:5]:
            print(f"    {company} (相似度: {similarity:.3f})")
    else:
        print("  ❌ 无模糊匹配")
    
    # 5. 最终搜索结果
    print("\n5️⃣ 最终搜索结果:")
    results = service.search_companies(query, limit=10)
    if results:
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['name']} (类型: {result['match_type']}, 分数: {result['score']})")
    else:
        print("  ❌ 无最终结果")

if __name__ == "__main__":
    debug_search() 