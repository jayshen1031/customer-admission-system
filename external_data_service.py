"""
外部企业数据集成服务
支持多个免费数据源，自动填充资信评分表
"""

import requests
import json
import time
import re
from typing import Dict, Optional, List
from dataclasses import dataclass
from urllib.parse import quote


@dataclass
class CompanyInfo:
    """企业信息数据结构"""
    company_name: str = ""
    legal_representative: str = ""
    registered_capital: str = ""
    paid_capital: str = ""
    establishment_date: str = ""
    business_status: str = ""
    company_type: str = ""
    business_scope: str = ""
    credit_code: str = ""
    address: str = ""
    industry: str = ""
    
    # 资信评分相关字段
    enterprise_nature: str = ""
    main_business_income: str = ""
    main_supplier: str = ""
    payment_method: str = ""
    account_period: str = ""
    years_established: int = 0
    mortgage_guarantee: str = ""
    dishonesty_record: str = ""
    penalty_record: str = ""
    payment_credit: str = ""
    peer_review: str = ""


class ExternalDataService:
    """外部数据服务类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # 配置多个数据源
        self.data_sources = [
            {
                'name': 'free_api_1',
                'url': 'http://42.193.122.222:8600/power_enterprise/get-enterprise-full-info',
                'method': 'GET',
                'rate_limit': 5  # 每分钟5次
            },
            {
                'name': 'backup_api',
                'url': 'http://39.106.33.248:8088/businesslicenseVerificationDetailed',
                'method': 'POST',
                'rate_limit': 10
            }
        ]
        
        # 请求计数器（简单的速率限制）
        self.request_counts = {}
        self.last_request_time = {}

    def search_company_info(self, company_name: str) -> Optional[CompanyInfo]:
        """
        根据企业名称搜索企业信息
        """
        try:
            # 尝试第一个免费API
            result = self._try_free_api_1(company_name)
            if result:
                return result
            
            # 如果第一个失败，尝试备用API
            result = self._try_backup_api(company_name)
            if result:
                return result
                
            # 如果API都失败，返回空结果
            return CompanyInfo(company_name=company_name)
            
        except Exception as e:
            print(f"获取企业信息失败: {e}")
            return CompanyInfo(company_name=company_name)

    def _try_free_api_1(self, company_name: str) -> Optional[CompanyInfo]:
        """尝试免费API 1"""
        try:
            # 检查速率限制
            if not self._check_rate_limit('free_api_1'):
                return None
                
            url = f"http://42.193.122.222:8600/power_enterprise/get-enterprise-full-info?name={quote(company_name)}"
            
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._parse_api_1_response(data)
                
        except Exception as e:
            print(f"免费API 1调用失败: {e}")
            
        return None

    def _try_backup_api(self, company_name: str) -> Optional[CompanyInfo]:
        """尝试备用API"""
        try:
            if not self._check_rate_limit('backup_api'):
                return None
                
            url = "http://39.106.33.248:8088/businesslicenseVerificationDetailed"
            data = {"verifynum": company_name}
            
            response = self.session.post(url, json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                return self._parse_backup_api_response(result)
                
        except Exception as e:
            print(f"备用API调用失败: {e}")
            
        return None

    def _parse_api_1_response(self, data: dict) -> CompanyInfo:
        """解析API 1的响应数据"""
        try:
            base_info = data.get('企业基本信息', {})
            
            # 提取基本信息
            company_info = CompanyInfo()
            company_info.company_name = base_info.get('企业名称', '')
            company_info.legal_representative = base_info.get('法人代表', '')
            company_info.registered_capital = base_info.get('注册资本', '')
            company_info.establishment_date = base_info.get('成立日期', '')
            company_info.business_status = base_info.get('经营状态', '')
            company_info.address = base_info.get('注册地址', '')
            company_info.industry = base_info.get('行业', '')
            company_info.credit_code = base_info.get('统一社会信用代码', '')
            company_info.business_scope = base_info.get('经营范围', '')
            
            # 分析并映射到资信评分字段
            self._analyze_and_map_credit_fields(company_info)
            
            return company_info
            
        except Exception as e:
            print(f"解析API响应失败: {e}")
            return CompanyInfo()

    def _parse_backup_api_response(self, data: dict) -> CompanyInfo:
        """解析备用API的响应数据"""
        try:
            words_result = data.get('words_result', {})
            base = words_result.get('base', {})
            
            company_info = CompanyInfo()
            company_info.company_name = base.get('社会统一信用代码', '')  # 需要根据实际API调整
            # 其他字段映射...
            
            self._analyze_and_map_credit_fields(company_info)
            return company_info
            
        except Exception as e:
            print(f"解析备用API响应失败: {e}")
            return CompanyInfo()

    def _analyze_and_map_credit_fields(self, company_info: CompanyInfo):
        """分析企业信息并映射到资信评分字段"""
        try:
            # 1. 企业性质分析
            company_info.enterprise_nature = self._determine_enterprise_nature(company_info.company_name)
            
            # 2. 计算成立年限
            if company_info.establishment_date:
                company_info.years_established = self._calculate_years_established(company_info.establishment_date)
            
            # 3. 分析注册资本等级
            # 这里可以根据注册资本数值进行分级
            
            # 4. 设置默认的信用状况（实际应该从更多数据源获取）
            company_info.dishonesty_record = "无"  # 默认值，实际需要查询
            company_info.penalty_record = "无"
            company_info.payment_credit = "付款及时，信用良好"
            company_info.peer_review = "评价良好"
            
        except Exception as e:
            print(f"分析企业信息失败: {e}")

    def _determine_enterprise_nature(self, company_name: str) -> str:
        """根据企业名称判断企业性质"""
        if any(keyword in company_name for keyword in ['国有', '央企', '中央', '国营']):
            return "国有企业"
        elif any(keyword in company_name for keyword in ['合资', '中外']):
            return "合资企业"
        elif '外资' in company_name or company_name.endswith('(外资)'):
            return "独资企业"
        elif any(keyword in company_name for keyword in ['有限责任', '有限公司', '股份']):
            return "民营企业"
        else:
            return "其他"

    def _calculate_years_established(self, date_str: str) -> int:
        """计算企业成立年限"""
        try:
            # 提取年份
            year_match = re.search(r'(\d{4})', date_str)
            if year_match:
                establishment_year = int(year_match.group(1))
                current_year = time.localtime().tm_year
                return current_year - establishment_year
        except:
            pass
        return 0

    def _check_rate_limit(self, api_name: str) -> bool:
        """检查API调用速率限制"""
        current_time = time.time()
        
        # 初始化计数器
        if api_name not in self.request_counts:
            self.request_counts[api_name] = 0
            self.last_request_time[api_name] = current_time
            
        # 如果距离上次请求超过1分钟，重置计数器
        if current_time - self.last_request_time[api_name] > 60:
            self.request_counts[api_name] = 0
            self.last_request_time[api_name] = current_time
            
        # 检查是否超过限制
        rate_limit = next((source['rate_limit'] for source in self.data_sources if source['name'] == api_name), 5)
        
        if self.request_counts[api_name] >= rate_limit:
            return False
            
        self.request_counts[api_name] += 1
        return True

    def get_credit_score_mapping(self, company_info: CompanyInfo) -> dict:
        """将企业信息映射为资信评分表的选项值"""
        mapping = {}
        
        try:
            # 企业性质映射
            nature_mapping = {
                "国有企业": "10",
                "合资企业": "8", 
                "独资企业": "8",
                "民营企业": "6",
                "私营企业": "6",
                "其他": "3"
            }
            mapping['enterpriseNature'] = nature_mapping.get(company_info.enterprise_nature, "3")
            
            # 注册资本映射
            if company_info.registered_capital:
                capital_str = re.sub(r'[^\d.]', '', company_info.registered_capital)
                try:
                    capital = float(capital_str)
                    if capital >= 10000:  # 1亿及以上
                        mapping['registeredCapital'] = "10"
                    elif capital >= 1000:  # 1000万-1亿
                        mapping['registeredCapital'] = "8"
                    elif capital >= 500:   # 500万-1000万
                        mapping['registeredCapital'] = "6"
                    else:                  # 小于500万
                        mapping['registeredCapital'] = "3"
                except:
                    mapping['registeredCapital'] = "3"
            
            # 成立年限映射
            if company_info.years_established >= 10:
                mapping['yearsEstablished'] = "5"
            elif company_info.years_established >= 2:
                mapping['yearsEstablished'] = "3"
            else:
                mapping['yearsEstablished'] = "1"
                
            # 信用记录映射
            mapping['dishonestyRecord'] = "6" if company_info.dishonesty_record == "无" else "0"
            mapping['penaltyRecord'] = "8" if company_info.penalty_record == "无" else "0"
            mapping['paymentCredit'] = "4"  # 默认良好
            mapping['peerReview'] = "2"     # 默认良好
            
        except Exception as e:
            print(f"映射资信评分失败: {e}")
            
        return mapping


# 示例使用
if __name__ == "__main__":
    service = ExternalDataService()
    
    # 测试查询
    company_name = "小米科技有限责任公司"
    result = service.search_company_info(company_name)
    
    if result:
        print(f"企业名称: {result.company_name}")
        print(f"法人代表: {result.legal_representative}")
        print(f"注册资本: {result.registered_capital}")
        print(f"成立日期: {result.establishment_date}")
        print(f"企业性质: {result.enterprise_nature}")
        print(f"成立年限: {result.years_established}年")
        
        # 获取资信评分映射
        mapping = service.get_credit_score_mapping(result)
        print(f"资信评分映射: {mapping}") 