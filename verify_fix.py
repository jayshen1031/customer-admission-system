#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from external_data_service import ExternalDataService
import json

def verify_weisideng_fix():
    """验证维斯登光电有限公司的数据修复效果"""
    service = ExternalDataService()
    
    print("🔧 验证维斯登光电有限公司数据修复效果")
    print("="*60)
    
    # 测试原问题中的企业
    result = service.search_company_info('维斯登光电有限公司')
    
    if result:
        print("✅ 企业信息获取成功!")
        print(f"📋 企业名称: {result.company_name}")
        
        # 重点检查用户反馈的问题字段
        issues_found = []
        
        # 检查注册资本（用户反馈的主要问题）
        if not result.registered_capital:
            issues_found.append("❌ 注册资本为空")
        else:
            print(f"✅ 注册资本已补齐: {result.registered_capital}")
            
        # 检查其他关键字段
        if not result.legal_representative:
            issues_found.append("❌ 法人代表为空")
        else:
            print(f"✅ 法人代表: {result.legal_representative}")
            
        if not result.establishment_date:
            issues_found.append("❌ 成立日期为空")
        else:
            print(f"✅ 成立日期: {result.establishment_date}")
            
        if not result.business_status:
            issues_found.append("❌ 经营状态为空")
        else:
            print(f"✅ 经营状态: {result.business_status}")
            
        if not result.industry:
            issues_found.append("❌ 行业信息为空")
        else:
            print(f"✅ 行业: {result.industry}")
            
        if not result.address:
            issues_found.append("❌ 地址为空")
        else:
            print(f"✅ 地址: {result.address}")
            
        if not result.credit_code:
            issues_found.append("❌ 信用代码为空")
        else:
            print(f"✅ 信用代码: {result.credit_code}")
        
        # 检查资信评分相关字段
        print(f"\n📊 资信评分相关字段:")
        print(f"🏆 企业性质: {result.enterprise_nature or '空'}")
        print(f"💰 主营业务收入: {result.main_business_income or '空'}")
        print(f"⏰ 成立年限: {result.years_established}年")
        print(f"🔒 抵押担保: {result.mortgage_guarantee or '空'}")
        print(f"💳 付款信用: {result.payment_credit or '空'}")
        
        # 获取评分映射
        credit_mapping = service.get_credit_score_mapping(result)
        print(f"\n🎯 资信评分映射预览:")
        print(f"企业性质得分: {credit_mapping.get('enterpriseNature', 'N/A')}")
        print(f"注册资本得分: {credit_mapping.get('registeredCapital', 'N/A')}")
        print(f"成立年限得分: {credit_mapping.get('yearsEstablished', 'N/A')}")
        
        # 总结修复结果
        print(f"\n📋 修复结果总结:")
        if not issues_found:
            print(f"🎉 所有问题已修复! 维斯登光电有限公司的资信数据已完整补齐")
            print(f"📝 特别是用户反馈的注册资本问题已解决: {result.registered_capital}")
        else:
            print(f"⚠️ 仍有以下问题需要解决:")
            for issue in issues_found:
                print(f"   {issue}")
                
    else:
        print("❌ 未能获取企业信息 - 这是一个严重问题!")

def test_related_companies():
    """测试相关企业的数据"""
    service = ExternalDataService()
    
    print(f"\n🔍 测试其他维斯登相关企业...")
    companies = [
        "维斯登科技(上海)有限公司",
        "维斯登光电技术有限公司"
    ]
    
    for company in companies:
        result = service.search_company_info(company)
        if result and result.registered_capital:
            print(f"✅ {company}: 注册资本 {result.registered_capital}")
        else:
            print(f"❌ {company}: 注册资本缺失")

if __name__ == "__main__":
    verify_weisideng_fix()
    test_related_companies() 