"""
企业名称智能补齐服务
支持模糊搜索和智能建议
"""

import re
import difflib
from typing import List, Dict
import json


class CompanyAutocompleteService:
    """企业名称自动补全服务"""
    
    def __init__(self):
        # 常见企业名称数据库（可以从真实数据库或API获取）
        self.company_database = [
            # 知名互联网公司
            "阿里巴巴(中国)有限公司",
            "阿里巴巴集团控股有限公司", 
            "腾讯科技(深圳)有限公司",
            "腾讯控股有限公司",
            "百度在线网络技术(北京)有限公司",
            "百度网讯科技有限公司",
            "字节跳动有限公司",
            "字节跳动科技有限公司",
            "小米科技有限责任公司",
            "小米通讯技术有限公司",
            "华为技术有限公司",
            "华为投资控股有限公司",
            "京东科技信息技术有限公司",
            "京东数字科技控股股份有限公司",
            "美团网络科技有限公司",
            "美团点评网络科技有限公司",
            "滴滴出行科技有限公司",
            "北京嘀嘀无限科技发展有限公司",
            
            # 金融机构
            "中国工商银行股份有限公司",
            "中国建设银行股份有限公司", 
            "中国农业银行股份有限公司",
            "中国银行股份有限公司",
            "招商银行股份有限公司",
            "平安银行股份有限公司",
            "中国人寿保险股份有限公司",
            "中国平安保险(集团)股份有限公司",
            "中国太平洋保险(集团)股份有限公司",
            
            # 制造业企业
            "比亚迪股份有限公司",
            "吉利汽车控股有限公司",
            "中国石油化工股份有限公司",
            "中国石油天然气股份有限公司",
            "中国海洋石油有限公司",
            "宝山钢铁股份有限公司",
            "中国神华能源股份有限公司",
            "格力电器股份有限公司",
            "美的集团股份有限公司",
            "海尔智家股份有限公司",
            
            # 房地产公司
            "万科企业股份有限公司",
            "碧桂园控股有限公司",
            "中国恒大集团",
            "融创中国控股有限公司",
            "绿地控股集团股份有限公司",
            "保利发展控股集团股份有限公司",
            "龙湖集团控股有限公司",
            
            # 零售连锁
            "沃尔玛(中国)投资有限公司",
            "家乐福(中国)管理咨询服务有限公司",
            "大润发投资有限公司",
            "苏宁易购集团股份有限公司",
            "国美零售控股有限公司",
            
            # 教育培训
            "新东方教育科技集团有限公司",
            "学而思教育科技有限公司",
            "中公教育科技有限公司",
            "达内时代科技集团有限公司",
            
            # 医药健康
            "恒瑞医药股份有限公司",
            "云南白药集团股份有限公司",
            "同仁堂科技发展股份有限公司",
            "片仔癀药业股份有限公司",
        ]
        
        # 构建搜索索引
        self._build_search_index()
        
    def _build_search_index(self):
        """构建搜索索引"""
        self.search_index = {}
        
        for company in self.company_database:
            # 提取关键词
            keywords = self._extract_keywords(company)
            
            for keyword in keywords:
                if keyword not in self.search_index:
                    self.search_index[keyword] = []
                if company not in self.search_index[keyword]:
                    self.search_index[keyword].append(company)
    
    def _extract_keywords(self, company_name: str) -> List[str]:
        """从企业名称中提取关键词"""
        keywords = []
        
        # 移除常见后缀
        suffixes = ['有限公司', '股份有限公司', '集团有限公司', '控股有限公司', 
                   '科技有限公司', '投资有限公司', '发展有限公司', '管理有限公司',
                   '集团股份有限公司', '控股股份有限公司', '(中国)', '(集团)', '(控股)']
        
        clean_name = company_name
        for suffix in suffixes:
            clean_name = clean_name.replace(suffix, '')
        
        # 提取中文字符
        chinese_chars = re.findall(r'[\u4e00-\u9fff]+', clean_name)
        
        for chars in chinese_chars:
            # 添加完整词组
            if len(chars) >= 2:
                keywords.append(chars)
            
            # 添加2-4字的子串
            for i in range(len(chars)):
                for j in range(i + 2, min(i + 5, len(chars) + 1)):
                    substring = chars[i:j]
                    if len(substring) >= 2:
                        keywords.append(substring)
        
        return keywords
    
    def search_companies(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索企业名称"""
        if not query or len(query) < 2:
            return []
        
        query = query.strip()
        results = []
        seen = set()
        
        # 1. 精确匹配
        for company in self.company_database:
            if query in company and company not in seen:
                results.append({
                    'name': company,
                    'match_type': 'exact',
                    'score': 100
                })
                seen.add(company)
        
        # 2. 关键词匹配
        for keyword, companies in self.search_index.items():
            if query in keyword:
                for company in companies:
                    if company not in seen:
                        # 计算匹配度
                        score = self._calculate_match_score(query, company)
                        if score > 50:  # 只保留相关度较高的结果
                            results.append({
                                'name': company,
                                'match_type': 'keyword',
                                'score': score
                            })
                            seen.add(company)
        
        # 3. 模糊匹配
        if len(results) < limit:
            for company in self.company_database:
                if company not in seen:
                    # 使用编辑距离进行模糊匹配
                    similarity = difflib.SequenceMatcher(None, query.lower(), company.lower()).ratio()
                    if similarity > 0.3:  # 相似度阈值
                        results.append({
                            'name': company,
                            'match_type': 'fuzzy',
                            'score': int(similarity * 100)
                        })
                        seen.add(company)
        
        # 按相关度排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:limit]
    
    def _calculate_match_score(self, query: str, company_name: str) -> int:
        """计算匹配度分数"""
        query = query.lower()
        company = company_name.lower()
        
        # 基础分数
        base_score = 0
        
        # 开头匹配加分
        if company.startswith(query):
            base_score += 50
        
        # 包含关系加分
        if query in company:
            base_score += 30
        
        # 字符覆盖率
        coverage = sum(1 for char in query if char in company) / len(query)
        base_score += int(coverage * 20)
        
        return min(base_score, 100)
    
    def get_popular_companies(self, limit: int = 20) -> List[str]:
        """获取热门企业名称"""
        # 返回一些知名企业作为热门推荐
        popular = [
            "阿里巴巴(中国)有限公司",
            "腾讯科技(深圳)有限公司", 
            "百度在线网络技术(北京)有限公司",
            "小米科技有限责任公司",
            "华为技术有限公司",
            "京东科技信息技术有限公司",
            "美团网络科技有限公司",
            "字节跳动有限公司",
            "中国工商银行股份有限公司",
            "中国建设银行股份有限公司",
            "招商银行股份有限公司",
            "比亚迪股份有限公司",
            "格力电器股份有限公司",
            "美的集团股份有限公司",
            "万科企业股份有限公司",
            "碧桂园控股有限公司",
            "新东方教育科技集团有限公司",
            "恒瑞医药股份有限公司",
            "苏宁易购集团股份有限公司",
            "滴滴出行科技有限公司"
        ]
        return popular[:limit]
    
    def add_company(self, company_name: str):
        """动态添加企业名称到数据库"""
        if company_name and company_name not in self.company_database:
            self.company_database.append(company_name)
            # 重建索引
            self._build_search_index()
    
    def get_suggestions_for_partial(self, partial: str) -> List[str]:
        """根据部分输入获取建议"""
        suggestions = []
        
        if len(partial) >= 2:
            results = self.search_companies(partial, limit=8)
            suggestions = [result['name'] for result in results]
        
        return suggestions


# 全局实例
autocomplete_service = CompanyAutocompleteService()


# 测试功能
if __name__ == "__main__":
    service = CompanyAutocompleteService()
    
    test_queries = ["阿里", "腾讯", "百度", "小米", "银行", "科技"]
    
    for query in test_queries:
        print(f"\n搜索: '{query}'")
        results = service.search_companies(query, limit=5)
        for result in results:
            print(f"  {result['name']} (匹配度: {result['score']}%)") 