---
title: "LangChain 与 LangGraph 深度解析"
description: "从基础到进阶，全面掌握 LangChain 框架和 LangGraph 状态机，构建复杂的 AI Agent 工作流。"
pubDate: 2026-05-14
updatedDate: 2026-05-14
tags: ["LangChain", "LangGraph", "LLM", "Agent", "工作流", "AI 工程"]
pinned: false
---

# LangChain 与 LangGraph 深度解析

本文将深入探讨 LangChain 框架和 LangGraph 状态机，从基础概念到高级应用，帮助你构建复杂、可维护的 AI Agent 系统。

## 为什么需要 LangChain 和 LangGraph？

### 传统 LLM 应用的局限性

直接使用 LLM 面临以下挑战：

- **状态管理困难** — 多轮对话难以维护上下文
- **工作流复杂** — 多步骤任务编排混乱
- **可观测性差** — 难以调试和监控
- **缺乏循环** — 无法实现迭代优化
- **人类介入难** — 难以实现人机协作

### LangChain 的解决方案

**LangChain** 提供了：
- 📦 **模块化组件** — 链、提示词、记忆、工具
- 🔗 **编排能力** — 将多个组件串联
- 🧠 **记忆管理** — 维护对话历史
- 🛠️ **工具集成** — 连接外部 API 和数据源

### LangGraph 的进阶能力

**LangGraph** 在 LangChain 基础上增加了：
- 🔄 **循环工作流** — 支持迭代和重试
- 🎯 **状态机** — 明确的状态转换
- 👥 **人机协作** — 人类审核和干预
- 📊 **可视化** — 工作流图可视化
- 💾 **持久化** — 检查点和恢复

## LangChain 核心概念

### 1. 链 (Chains)

链是 LangChain 的基本构建块，将多个组件串联起来。

```python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# 创建提示模板
prompt = PromptTemplate(
    input_variables=["topic"],
    template="请写一篇关于 {topic} 的短文，不超过 200 字。"
)

# 创建 LLM
llm = OpenAI(temperature=0.7)

# 创建链
chain = LLMChain(llm=llm, prompt=prompt)

# 执行
result = chain.run("人工智能")
print(result)
```

### 2. 提示词管理 (Prompts)

```python
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# 聊天提示模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有帮助的助手。"),
    MessagesPlaceholder("chat_history"),  # 对话历史
    ("human", "{input}")  # 用户输入
])

# 格式化提示
messages = prompt.format_messages(
    chat_history=[...],
    input="你好"
)
```

### 3. 记忆 (Memory)

记忆组件维护对话历史，实现多轮对话。

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# 创建带记忆的链
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 多轮对话
conversation.predict(input="我叫 Edward")
conversation.predict(input="我做什么工作的？")
```

**记忆类型对比：**

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| ConversationBufferMemory | 存储所有历史消息 | 简单对话 |
| ConversationBufferWindowMemory | 只保留最近 N 条 | 长对话节省 token |
| ConversationSummaryMemory | 摘要历史对话 | 超长对话 |
| EntityMemory | 提取实体信息 | 需要记住事实的对话 |

### 4. 工具 (Tools)

工具让 LLM 能够调用外部函数和 API。

```python
from langchain.agents import tool

@tool
def get_current_weather(city: str) -> str:
    """获取当前天气信息"""
    # 模拟天气数据
    return f"{city} 当前温度 25°C，晴天"

@tool
def search_web(query: str) -> str:
    """搜索网络信息"""
    # 调用搜索引擎 API
    return f"搜索结果：{query} 的相关信息"

tools = [get_current_weather, search_web]
```

### 5. 代理 (Agents)

代理能够自主选择和使用工具。

```python
from langchain.agents import initialize_agent, AgentType

# 初始化代理
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    handle_parsing_errors=True,
    verbose=True
)

# 执行任务
response = agent.run("北京的天气怎么样？")
print(response)
```

## LangGraph 核心概念

### 什么是 LangGraph？

LangGraph 是基于 LangChain 的**有向图**框架，用于构建多 Agent、多步骤的 AI 应用。

**核心特性：**
- **状态机** — 明确定义状态和转换
- **循环** — 支持迭代和重试
- **人机协作** — 人类审核节点
- **持久化** — 检查点和恢复
- **可视化** — 自动生成流程图

### 1. 图的基本结构

```python
from langgraph.graph import StateGraph, END

# 定义状态
class State(TypedDict):
    input: str
    output: str
    iterations: int
    approval: bool

# 创建图
workflow = StateGraph(State)

# 添加节点
workflow.add_node("agent", agent_node)
workflow.add_node("human", human_approval_node)
workflow.add_node("refine", refinement_node)

# 添加边
workflow.add_edge("agent", "human")
workflow.add_conditional_edges(
    "human",
    should_refine,  # 条件函数
    {
        "yes": "refine",
        "no": END
    }
)

# 设置入口点
workflow.set_entry_point("agent")

# 编译图
app = workflow.compile()
```

### 2. 状态管理

状态是 LangGraph 的核心，在节点间传递。

```python
from typing import TypedDict, Annotated, Sequence
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

# 定义状态
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    context: dict
    loop_count: int
    human_approved: bool

# 节点函数接收和返回状态
def agent_node(state: AgentState) -> AgentState:
    # 访问状态
    messages = state["messages"]
    
    # 处理逻辑
    response = llm.invoke(messages)
    
    # 返回更新的状态
    return {"messages": [response]}

def human_approval_node(state: AgentState) -> AgentState:
    # 等待人类审批
    approval = wait_for_human_approval(state["messages"])
    
    return {"human_approved": approval}
```

### 3. 条件边

条件边根据状态决定下一步走向。

```python
def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """决定是否继续执行工具"""
    last_message = state["messages"][-1]
    
    if last_message.tool_calls:
        return "tools"
    return "end"

def check_approval(state: AgentState) -> Literal["approve", "reject", "revise"]:
    """检查人类审批结果"""
    if state["human_approved"]:
        return "approve"
    elif state["loop_count"] > 3:
        return "reject"
    return "revise"

# 添加条件边
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tool_executor",
        "end": END
    }
)

workflow.add_conditional_edges(
    "human",
    check_approval,
    {
        "approve": END,
        "reject": "end_with_error",
        "revise": "agent"
    }
)
```

### 4. 循环和迭代

LangGraph 天然支持循环，通过条件边实现。

```python
# 定义最大迭代次数
MAX_ITERATIONS = 5

def iterative_refinement(state: AgentState) -> AgentState:
    """迭代优化答案"""
    if state["loop_count"] >= MAX_ITERATIONS:
        return {"loop_count": state["loop_count"]}
    
    # 生成改进版本
    improved = refine_answer(state["messages"])
    
    return {
        "messages": [improved],
        "loop_count": state["loop_count"] + 1
    }

# 添加循环边
workflow.add_edge("refine", "agent")  # 回到 agent 节点
```

### 5. 持久化和检查点

```python
from langgraph.checkpoint.memory import MemorySaver

# 创建检查点存储器
checkpointer = MemorySaver()

# 编译时传入
app = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["human"]  # 在 human 节点前中断
)

# 创建线程
config = {"configurable": {"thread_id": "1"}}

# 执行并保存状态
result = app.invoke({"messages": ["你好"]}, config)

# 恢复状态继续执行
result = app.invoke({"messages": ["继续"]}, config)
```

## 实战案例

### 案例 1：带人类审核的内容生成

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage

class ContentState(TypedDict):
    topic: str
    draft: str
    feedback: str
    approved: bool
    iteration: int

def generate_draft(state: ContentState) -> ContentState:
    """生成内容草稿"""
    prompt = f"""
    请写一篇关于 {state['topic']} 的文章。
    {f'根据反馈改进：{state["feedback"]}' if state.get('feedback') else ''}
    """
    
    response = llm.invoke(prompt)
    return {"draft": response.content, "iteration": state.get("iteration", 0) + 1}

def human_review(state: ContentState) -> ContentState:
    """人类审核"""
    print(f"当前草稿：{state['draft']}")
    print(f"迭代次数：{state['iteration']}")
    
    # 模拟人类输入
    approval = input("批准？(y/n/r 修订): ")
    
    if approval == 'y':
        return {"approved": True}
    elif approval == 'n':
        return {"approved": False}
    else:
        feedback = input("提供反馈：")
        return {"feedback": feedback, "approved": False}

def decide_next(state: ContentState) -> str:
    """决定下一步"""
    if state["approved"]:
        return "end"
    elif state["iteration"] >= 3:
        return "end"  # 达到最大迭代
    return "revise"

# 构建图
workflow = StateGraph(ContentState)

workflow.add_node("generate", generate_draft)
workflow.add_node("review", human_review)

workflow.set_entry_point("generate")
workflow.add_edge("generate", "review")

workflow.add_conditional_edges(
    "review",
    decide_next,
    {
        "revise": "generate",
        "end": END
    }
)

app = workflow.compile()

# 执行
result = app.invoke({
    "topic": "人工智能的未来",
    "iteration": 0
})

print(f"最终内容：{result['draft']}")
```

### 案例 2：多 Agent 协作系统

```python
from typing import Literal

class MultiAgentState(TypedDict):
    query: str
    research: str
    analysis: str
    draft: str
    final_answer: str

# 研究 Agent
def researcher(state: MultiAgentState) -> MultiAgentState:
    """收集信息"""
    research_tools = [search_web, get_wikipedia, read_document]
    
    agent = create_agent(research_tools, "研究专家")
    result = agent.run(f"研究主题：{state['query']}")
    
    return {"research": result}

# 分析 Agent
def analyst(state: MultiAgentState) -> MultiAgentState:
    """分析信息"""
    prompt = f"""
    基于以下研究结果进行分析：
    {state['research']}
    
    请提供：
    1. 关键发现
    2. 数据支持
    3. 潜在问题
    """
    
    analysis = llm.invoke(prompt)
    return {"analysis": analysis.content}

# 写作 Agent
def writer(state: MultiAgentState) -> MultiAgentState:
    """撰写答案"""
    prompt = f"""
    综合以下信息撰写最终答案：
    
    研究：{state['research']}
    分析：{state['analysis']}
    
    要求：
    - 结构清晰
    - 论据充分
    - 语言流畅
    """
    
    draft = llm.invoke(prompt)
    return {"draft": draft.content}

# 评审 Agent
def reviewer(state: MultiAgentState) -> Literal["approve", "revise"]:
    """评审答案"""
    prompt = f"""
    评审以下答案质量：
    {state['draft']}
    
    评分标准：
    - 准确性
    - 完整性
    - 逻辑性
    
    如果满意返回 'approve'，否则返回 'revise'
    """
    
    review = llm.invoke(prompt)
    return "approve" if "满意" in review.content else "revise"

# 构建多 Agent 图
workflow = StateGraph(MultiAgentState)

workflow.add_node("researcher", researcher)
workflow.add_node("analyst", analyst)
workflow.add_node("writer", writer)
workflow.add_node("reviewer", reviewer)

# 定义流程
workflow.set_entry_point("researcher")
workflow.add_edge("researcher", "analyst")
workflow.add_edge("analyst", "writer")
workflow.add_edge("writer", "reviewer")

# 添加条件边
workflow.add_conditional_edges(
    "reviewer",
    (lambda state: "revise" if reviewer(state) == "revise" else "end"),
    {
        "revise": "writer",
        "end": END
    }
)

app = workflow.compile()

# 执行
result = app.invoke({"query": "量子计算的发展现状"})
print(result["draft"])
```

### 案例 3：ReAct 模式实现

```python
from langgraph.prebuilt import ToolNode
from langchain.agents import AgentExecutor

class ReActState(TypedDict):
    messages: Annotated[list, add_messages]
    tool_output: str

def model_node(state: ReActState) -> ReActState:
    """LLM 决策节点"""
    messages = state["messages"]
    
    # 使用能够进行工具调用的模型
    response = llm_with_tools.invoke(messages)
    
    return {"messages": [response]}

def tool_node(state: ReActState) -> ReActState:
    """工具执行节点"""
    # 执行工具调用
    tool_calls = state["messages"][-1].tool_calls
    
    outputs = []
    for tool_call in tool_calls:
        tool = tools_by_name[tool_call["name"]]
        response = tool.invoke(tool_call["args"])
        outputs.append(response)
    
    return {"tool_output": "\n".join(outputs)}

def should_continue(state: ReActState) -> Literal["tools", "end"]:
    """判断是否需要调用工具"""
    messages = state["messages"]
    last_message = messages[-1]
    
    if last_message.tool_calls:
        return "tools"
    return "end"

# 构建 ReAct 图
workflow = StateGraph(ReActState)

workflow.add_node("agent", model_node)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

workflow.add_edge("tools", "agent")

app = workflow.compile()

# 执行
result = app.invoke({
    "messages": [HumanMessage(content="北京今天的天气如何？")]
})

print(result["messages"][-1].content)
```

## 高级模式

### 1. 子图 (Subgraphs)

将复杂工作流分解为子图。

```python
# 创建子图
research_workflow = StateGraph(ResearchState)
research_workflow.add_node("search", search_node)
research_workflow.add_node("analyze", analyze_node)
research_workflow.compile()

# 在主图中使用子图
main_workflow = StateGraph(MainState)
main_workflow.add_node("research", research_workflow)
main_workflow.add_node("write", write_node)
```

### 2. 并发执行

```python
from langgraph.graph import START

# 并行启动多个节点
workflow.add_edge(START, "researcher")
workflow.add_edge(START, "data_collector")
workflow.add_edge(START, "context_loader")

# 汇合点
workflow.add_edge("researcher", "synthesizer")
workflow.add_edge("data_collector", "synthesizer")
workflow.add_edge("context_loader", "synthesizer")
```

### 3. 动态图

根据运行时状态动态修改图结构。

```python
def dynamic_router(state: State) -> str:
    """动态决定执行路径"""
    if state["complexity"] > 0.8:
        return "complex_workflow"
    elif state["complexity"] > 0.5:
        return "medium_workflow"
    return "simple_workflow"

workflow.add_conditional_edges(
    START,
    dynamic_router,
    {
        "simple_workflow": "simple_agent",
        "medium_workflow": "medium_agent",
        "complex_workflow": "complex_agent"
    }
)
```

### 4. 超时和重试

```python
from langgraph.pregel import RetryPolicy

app = workflow.compile(
    checkpointer=checkpointer,
    retry_policy=RetryPolicy(
        max_attempts=3,
        interval=1.0,
        backoff=2.0
    ),
    timeout=300  # 5 分钟超时
)
```

## 调试和监控

### 1. 可视化

```python
# 生成流程图
app.get_graph().draw_mermaid_png(output_path="workflow.png")

# 或生成 Mermaid 代码
mermaid = app.get_graph().draw_mermaid()
print(mermaid)
```

### 2. 日志记录

```python
from langgraph.prebuilt import InjectedState

def logged_node(state: AgentState) -> AgentState:
    import logging
    logging.info(f"进入节点，状态：{state}")
    
    # 处理逻辑
    result = process(state)
    
    logging.info(f"节点完成，返回：{result}")
    return result
```

### 3. 追踪

```python
from langchain.tracers import LangChainTracer

with LangChainTracer(project="langgraph-demo") as tracer:
    result = app.invoke(input_data)
```

## 最佳实践

### 1. 状态设计

- ✅ 使用 TypedDict 定义明确的状态结构
- ✅ 保持状态不可变，返回新状态而非修改
- ✅ 使用 Annotated 和 reducer 函数管理复杂状态

### 2. 节点设计

- ✅ 单一职责：每个节点只做一件事
- ✅ 无副作用：节点不应修改外部状态
- ✅ 可测试：节点函数应易于单元测试

### 3. 错误处理

```python
def safe_node(state: State) -> State:
    try:
        result = risky_operation(state)
        return {"result": result}
    except Exception as e:
        return {
            "error": str(e),
            "fallback": default_value
        }
```

### 4. 性能优化

- 使用异步节点处理 I/O 密集型任务
- 缓存重复计算结果
- 合理设置超时和重试策略
- 使用检查点避免重复计算

## LangChain vs LangGraph 对比

| 特性 | LangChain | LangGraph |
|------|-----------|-----------|
| 工作流类型 | 线性链 | 有向图 |
| 循环支持 | 有限 | 原生支持 |
| 状态管理 | 简单 | 复杂状态机 |
| 人机协作 | 困难 | 内置支持 |
| 持久化 | 基础 | 检查点机制 |
| 可视化 | 简单 | 完整流程图 |
| 适用场景 | 简单任务 | 复杂 Agent 系统 |

## 总结

### 核心要点

1. **LangChain** 提供了构建 LLM 应用的基础组件
2. **LangGraph** 在 LangChain 之上增加了图结构和状态机
3. **状态管理** 是 LangGraph 的核心，确保数据在节点间正确传递
4. **条件边** 实现动态流程控制
5. **检查点** 支持持久化和恢复
6. **人机协作** 实现人类审核和干预

### 学习路径

1. 掌握 LangChain 基础：链、提示词、记忆、工具
2. 理解 LangGraph 核心：状态、节点、边
3. 实践常见模式：ReAct、人类审核、多 Agent
4. 探索高级特性：子图、并发、动态图
5. 学习调试和监控技巧

### 下一步

- [ ] 阅读官方文档：https://langchain-ai.github.io/langgraph/
- [ ] 尝试构建自己的 Agent 系统
- [ ] 学习 LangSmith 追踪和调试
- [ ] 探索与其他框架的集成
- [ ] 参与开源社区贡献

---

**更新时间**: 2026-05-14  
**阅读时间**: 25 分钟  
**适用场景**: LLM 应用开发、Agent 系统构建、工作流编排

### 参考资源

- [LangChain 官方文档](https://python.langchain.com/)
- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangChain GitHub](https://github.com/langchain-ai/langchain)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
