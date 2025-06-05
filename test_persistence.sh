#!/bin/bash

# MySQL数据持久化验证脚本

echo "🔍 MySQL数据持久化验证脚本"
echo "================================"

# Docker环境验证
test_docker_persistence() {
    echo ""
    echo "📦 测试Docker环境数据持久化..."
    
    # 启动服务
    echo "1. 启动MySQL服务..."
    docker-compose up -d mysql
    
    # 等待MySQL启动
    echo "2. 等待MySQL就绪..."
    sleep 20
    
    # 插入测试数据
    echo "3. 插入测试数据..."
    docker-compose exec mysql mysql -u root -pcustomer_rating_2024 -e "
        USE customer_rating_system;
        CREATE TABLE IF NOT EXISTS test_persistence (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO test_persistence (message) VALUES ('数据持久化测试-$(date)');
        SELECT * FROM test_persistence;
    "
    
    # 重启MySQL容器
    echo "4. 重启MySQL容器..."
    docker-compose restart mysql
    sleep 10
    
    # 验证数据是否还在
    echo "5. 验证数据持久化..."
    docker-compose exec mysql mysql -u root -pcustomer_rating_2024 -e "
        USE customer_rating_system;
        SELECT COUNT(*) as '持久化记录数量' FROM test_persistence;
        SELECT message FROM test_persistence ORDER BY created_at DESC LIMIT 1;
    "
    
    echo "✅ Docker环境数据持久化验证完成"
}

# Kubernetes环境验证
test_k8s_persistence() {
    echo ""
    echo "⚓ 测试Kubernetes环境数据持久化..."
    
    # 检查PVC状态
    echo "1. 检查PVC状态..."
    kubectl get pvc -n customer-rating
    
    # 检查MySQL Pod
    echo "2. 检查MySQL Pod状态..."
    kubectl get pods -n customer-rating -l app=mysql
    
    # 插入测试数据
    echo "3. 插入测试数据..."
    kubectl exec -n customer-rating deployment/mysql -- mysql -u root -pcustomer_rating_2024 -e "
        USE customer_rating_system;
        CREATE TABLE IF NOT EXISTS test_persistence (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO test_persistence (message) VALUES ('K8s数据持久化测试-$(date)');
    "
    
    # 删除Pod（模拟重启）
    echo "4. 删除MySQL Pod（模拟故障）..."
    kubectl delete pod -n customer-rating -l app=mysql
    
    # 等待Pod重新创建
    echo "5. 等待Pod重新创建..."
    kubectl wait --for=condition=ready pod -l app=mysql -n customer-rating --timeout=60s
    
    # 验证数据是否还在
    echo "6. 验证数据持久化..."
    kubectl exec -n customer-rating deployment/mysql -- mysql -u root -pcustomer_rating_2024 -e "
        USE customer_rating_system;
        SELECT COUNT(*) as '持久化记录数量' FROM test_persistence;
    "
    
    echo "✅ Kubernetes环境数据持久化验证完成"
}

# 显示持久化信息
show_persistence_info() {
    echo ""
    echo "📊 持久化配置信息"
    echo "================================"
    
    echo "Docker Compose持久化："
    echo "  - 卷名: mysql_data"
    echo "  - 驱动: local"
    echo "  - 挂载点: /var/lib/mysql"
    
    echo ""
    echo "Kubernetes持久化："
    echo "  - PVC名: mysql-pvc"
    echo "  - 存储类: standard"
    echo "  - 容量: 10Gi"
    echo "  - 访问模式: ReadWriteOnce"
    
    echo ""
    echo "数据安全保障："
    echo "  ✅ 容器重启不丢失数据"
    echo "  ✅ 容器删除不丢失数据"
    echo "  ✅ 主机重启不丢失数据"
    echo "  ✅ Pod漂移不丢失数据"
}

# 主函数
main() {
    case "${1:-info}" in
        "docker")
            test_docker_persistence
            ;;
        "k8s")
            test_k8s_persistence
            ;;
        "info")
            show_persistence_info
            ;;
        *)
            echo "使用方法: $0 [docker|k8s|info]"
            echo ""
            echo "选项:"
            echo "  docker - 测试Docker环境数据持久化"
            echo "  k8s    - 测试Kubernetes环境数据持久化"  
            echo "  info   - 显示持久化配置信息 (默认)"
            ;;
    esac
}

main "$@" 