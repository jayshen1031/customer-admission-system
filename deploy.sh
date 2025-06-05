#!/bin/bash

# 客户准入系统部署脚本
# 使用方法: ./deploy.sh [docker|k8s] [build|deploy|stop|clean]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认参数
PLATFORM=${1:-docker}
ACTION=${2:-deploy}
IMAGE_NAME="customer-rating-system"
IMAGE_TAG="latest"

# 帮助信息
show_help() {
    echo "客户准入系统部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [platform] [action]"
    echo ""
    echo "平台选项:"
    echo "  docker    - Docker Compose部署 (默认)"
    echo "  k8s       - Kubernetes部署"
    echo ""
    echo "操作选项:"
    echo "  build     - 构建镜像"
    echo "  deploy    - 部署应用 (默认)"
    echo "  stop      - 停止应用"
    echo "  clean     - 清理资源"
    echo "  logs      - 查看日志"
    echo ""
    echo "示例:"
    echo "  $0 docker build    # 构建Docker镜像"
    echo "  $0 docker deploy   # Docker Compose部署"
    echo "  $0 k8s deploy      # Kubernetes部署"
    echo ""
}

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    if [[ "$PLATFORM" == "docker" ]]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker未安装"
            exit 1
        fi
        if ! command -v docker-compose &> /dev/null; then
            log_error "Docker Compose未安装"
            exit 1
        fi
    elif [[ "$PLATFORM" == "k8s" ]]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl未安装"
            exit 1
        fi
    fi
}

# 构建Docker镜像
build_image() {
    log_info "构建Docker镜像: $IMAGE_NAME:$IMAGE_TAG"
    docker build -t $IMAGE_NAME:$IMAGE_TAG .
    log_success "镜像构建完成"
}

# Docker Compose部署
docker_deploy() {
    log_info "使用Docker Compose部署..."
    
    # 检查.env文件
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，创建默认配置"
        cat > .env << EOF
# 数据库配置
DB_NAME=customer_rating_system
DB_USER=app_user
DB_PASSWORD=app_password
MYSQL_ROOT_PASSWORD=customer_rating_2024

# 应用配置
FLASK_ENV=production
EOF
    fi
    
    # 构建并启动服务
    docker-compose up --build -d
    
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "服务启动成功！"
        echo ""
        echo "访问地址:"
        echo "  应用: http://localhost:5001"
        echo "  Nginx: http://localhost"
        echo ""
        echo "查看日志: docker-compose logs -f"
        echo "停止服务: docker-compose down"
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# Docker Compose停止
docker_stop() {
    log_info "停止Docker Compose服务..."
    docker-compose down
    log_success "服务已停止"
}

# Docker Compose清理
docker_clean() {
    log_info "清理Docker资源..."
    docker-compose down -v --rmi all
    docker system prune -f
    log_success "清理完成"
}

# Kubernetes部署
k8s_deploy() {
    log_info "部署到Kubernetes..."
    
    # 检查命名空间
    if ! kubectl get namespace customer-rating &> /dev/null; then
        log_info "创建命名空间..."
        kubectl apply -f k8s/namespace.yaml
    fi
    
    # 部署配置
    log_info "部署ConfigMap和Secret..."
    kubectl apply -f k8s/configmap.yaml
    
    # 部署MySQL
    log_info "部署MySQL..."
    kubectl apply -f k8s/mysql.yaml
    
    # 等待MySQL就绪
    log_info "等待MySQL启动..."
    kubectl wait --for=condition=ready pod -l app=mysql -n customer-rating --timeout=300s
    
    # 部署应用
    log_info "部署应用..."
    kubectl apply -f k8s/app.yaml
    
    # 部署Ingress
    log_info "部署Ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    # 等待应用就绪
    log_info "等待应用启动..."
    kubectl wait --for=condition=ready pod -l app=customer-rating-app -n customer-rating --timeout=300s
    
    log_success "Kubernetes部署完成！"
    echo ""
    echo "查看状态:"
    echo "  kubectl get all -n customer-rating"
    echo ""
    echo "访问应用:"
    echo "  kubectl port-forward -n customer-rating svc/customer-rating-service 8080:80"
    echo "  然后访问: http://localhost:8080"
}

# Kubernetes停止
k8s_stop() {
    log_info "停止Kubernetes服务..."
    kubectl delete -f k8s/ --ignore-not-found=true
    log_success "服务已停止"
}

# Kubernetes清理
k8s_clean() {
    log_info "清理Kubernetes资源..."
    kubectl delete namespace customer-rating --ignore-not-found=true
    log_success "清理完成"
}

# 查看日志
show_logs() {
    if [[ "$PLATFORM" == "docker" ]]; then
        docker-compose logs -f
    elif [[ "$PLATFORM" == "k8s" ]]; then
        kubectl logs -f -l app=customer-rating-app -n customer-rating
    fi
}

# 主函数
main() {
    case "$1" in
        "-h"|"--help"|"help")
            show_help
            exit 0
            ;;
    esac
    
    log_info "客户准入系统部署脚本"
    log_info "平台: $PLATFORM, 操作: $ACTION"
    
    check_dependencies
    
    case "$ACTION" in
        "build")
            build_image
            ;;
        "deploy")
            if [[ "$PLATFORM" == "docker" ]]; then
                build_image
                docker_deploy
            elif [[ "$PLATFORM" == "k8s" ]]; then
                build_image
                k8s_deploy
            fi
            ;;
        "stop")
            if [[ "$PLATFORM" == "docker" ]]; then
                docker_stop
            elif [[ "$PLATFORM" == "k8s" ]]; then
                k8s_stop
            fi
            ;;
        "clean")
            if [[ "$PLATFORM" == "docker" ]]; then
                docker_clean
            elif [[ "$PLATFORM" == "k8s" ]]; then
                k8s_clean
            fi
            ;;
        "logs")
            show_logs
            ;;
        *)
            log_error "未知操作: $ACTION"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 