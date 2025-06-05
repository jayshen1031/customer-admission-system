#!/usr/bin/env python3
"""
测试外部企业数据API功能
"""

from external_data_service import ExternalDataService
import json


def test_external_api():
    """测试外部API功能"""
    print("🚀 开始测试外部企业数据API...")
    
    service = ExternalDataService()
    
    # 测试企业列表
    test_companies = [
        "小米科技有限责任公司",
        "阿里巴巴集团控股有限公司", 
        "腾讯科技(深圳)有限公司",
        "百度在线网络技术(北京)有限公司"
    ]
    
    for company_name in test_companies:
        print(f"\n📊 测试企业: {company_name}")
        print("-" * 50)
        
        try:
            # 获取企业信息
            result = service.search_company_info(company_name)
            
            if result and result.company_name:
                print(f"✅ 成功获取企业信息:")
                print(f"   企业名称: {result.company_name}")
                print(f"   法人代表: {result.legal_representative}")
                print(f"   注册资本: {result.registered_capital}")
                print(f"   成立日期: {result.establishment_date}")
                print(f"   经营状态: {result.business_status}")
                print(f"   企业性质: {result.enterprise_nature}")
                print(f"   成立年限: {result.years_established}年")
                
                # 获取资信评分映射
                mapping = service.get_credit_score_mapping(result)
                print(f"   资信评分映射: {json.dumps(mapping, ensure_ascii=False, indent=2)}")
                
            else:
                print(f"❌ 未能获取 {company_name} 的信息")
                
        except Exception as e:
            print(f"❌ 测试失败: {e}")
    
    print(f"\n🎯 测试完成!")


def test_single_company():
    """测试单个企业"""
    service = ExternalDataService()
    
    company_name = input("请输入要测试的企业名称: ").strip()
    if not company_name:
        company_name = "小米科技有限责任公司"  # 默认值
    
    print(f"\n📊 获取企业信息: {company_name}")
    
    try:
        result = service.search_company_info(company_name)
        
        if result and result.company_name:
            print(f"\n✅ 企业信息获取成功!")
            print(f"企业名称: {result.company_name}")
            print(f"法人代表: {result.legal_representative}")  
            print(f"注册资本: {result.registered_capital}")
            print(f"成立日期: {result.establishment_date}")
            print(f"经营状态: {result.business_status}")
            print(f"行业类型: {result.industry}")
            print(f"统一社会信用代码: {result.credit_code}")
            print(f"注册地址: {result.address}")
            print(f"企业性质分析: {result.enterprise_nature}")
            print(f"成立年限: {result.years_established}年")
            
            # 显示详细的资信评分映射
            mapping = service.get_credit_score_mapping(result)
            print(f"\n📋 资信评分表自动填充数据:")
            for key, value in mapping.items():
                field_names = {
                    'enterpriseNature': '企业性质',
                    'registeredCapital': '注册资本',
                    'yearsEstablished': '成立年限', 
                    'dishonestyRecord': '失信记录',
                    'penaltyRecord': '工商处罚记录',
                    'paymentCredit': '付款信用情况',
                    'peerReview': '客户同行评价'
                }
                field_name = field_names.get(key, key)
                print(f"   {field_name}: {value}分")
            
        else:
            print(f"❌ 未找到企业 '{company_name}' 的信息")
            print("💡 请检查企业名称是否正确，或者该企业可能不在数据库中")
            
    except Exception as e:
        print(f"❌ 获取失败: {e}")


if __name__ == "__main__":
    print("=== 外部企业数据API测试工具 ===")
    print("1. 批量测试多个企业")
    print("2. 测试单个企业")
    
    choice = input("\n请选择测试模式 (1/2): ").strip()
    
    if choice == "1":
        test_external_api()
    elif choice == "2":
        test_single_company()
    else:
        print("使用默认模式...")
        test_single_company() 