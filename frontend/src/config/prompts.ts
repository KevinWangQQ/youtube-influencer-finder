// AI关键词扩展Prompt配置文件
// 用于OpenAI API调用的各种场景化prompt模板

export const PROMPT_TEMPLATES = {
  // 原始通用prompt
  GENERAL: `Based on the topic "{topic}", generate 8-10 specific and relevant keywords that would help find YouTube influencers in this niche. Focus on:
1. Specific sub-topics and niches
2. Related terms and synonyms  
3. Industry-specific terminology
4. Content types related to this topic

Return only the keywords, separated by commas, without explanations.`,

  // TP-Link竞品分析专用prompt
  TPLINK_COMPETITOR_ANALYSIS: `You are helping TP-Link analyze competitors and find relevant influencers for networking and smart home products. 

Based on the topic "{topic}", generate 8-10 strategic keywords to find YouTube influencers who review networking equipment, smart home devices, and tech products that compete with TP-Link. Focus on:

1. **Product Categories**: 
   - Router, WiFi 6, mesh networking, access points
   - Smart home hubs, IoT devices, home automation
   - Network security, parental controls, QoS

2. **Competitor Brands & Products**:
   - Netgear, Linksys, ASUS, Ubiquiti
   - Eero, Google Nest WiFi, Amazon Eero
   - Philips Hue, SmartThings, Zigbee devices

3. **Technical Terms**:
   - WiFi 6E, WiFi 7, mesh system, tri-band
   - Smart switch, smart plug, smart lighting
   - Network setup, home network, bandwidth

4. **Content Types**:
   - Product reviews, unboxing, setup tutorials
   - Speed tests, range tests, comparison videos
   - Smart home tours, automation demos

5. **Use Cases**:
   - Gaming router, streaming setup, work from home
   - Smart home integration, voice control
   - Network troubleshooting, performance optimization

Return only the keywords, separated by commas, without explanations. Prioritize terms that tech reviewers and smart home enthusiasts commonly use.`,

  // 科技产品评测专用prompt
  TECH_REVIEW: `Based on the topic "{topic}", generate 8-10 keywords to find tech reviewers and influencers. Focus on:
1. Product review terminology
2. Tech channel keywords  
3. Comparison and benchmark terms
4. Setup and tutorial content
5. Brand and model variations

Return only the keywords, separated by commas, without explanations.`,

  // 智能家居专用prompt
  SMART_HOME: `Based on the topic "{topic}", generate 8-10 keywords to find smart home influencers and content creators. Focus on:
1. Smart home device categories
2. Home automation platforms
3. Integration and compatibility terms
4. Setup and installation content
5. Lifestyle and convenience aspects

Return only the keywords, separated by commas, without explanations.`,

  // 产品聚焦prompt - 专门用于寻找特定产品的评测者
  PRODUCT_FOCUSED: `You are helping find YouTube influencers who specifically review and discuss the exact product: "{topic}".

CRITICAL: Keep the exact product name "{topic}" in most keywords. DO NOT expand to other products or general categories.

Generate 8-10 specific keywords that YouTubers would use when creating content about "{topic}". Focus on:

1. **Product + Review Terms**:
   - "{topic} review", "{topic} honest review", "{topic} full review"
   - "{topic} unboxing", "{topic} first impressions", "{topic} hands on"

2. **Product + Testing Terms**:
   - "{topic} test", "{topic} speed test", "{topic} performance test"
   - "{topic} setup", "{topic} installation", "{topic} tutorial"

3. **Product + Comparison Terms**:
   - "{topic} vs", "{topic} comparison", "{topic} or"
   - "{topic} worth it", "{topic} should you buy"

4. **Product + Experience Terms**:
   - "{topic} experience", "{topic} after 1 month", "{topic} long term"
   - "{topic} problems", "{topic} issues", "{topic} pros and cons"

Return ONLY the keywords separated by commas. Each keyword MUST contain "{topic}" to find influencers who specifically discuss this exact product.`
};

// Prompt选择器 - 根据场景选择合适的prompt
export class PromptSelector {
  static getPrompt(topic: string, scenario: 'general' | 'tplink' | 'tech' | 'smart_home' | 'product_focused' = 'product_focused'): string {
    const templates = {
      general: PROMPT_TEMPLATES.GENERAL,
      tplink: PROMPT_TEMPLATES.TPLINK_COMPETITOR_ANALYSIS,
      tech: PROMPT_TEMPLATES.TECH_REVIEW,
      smart_home: PROMPT_TEMPLATES.SMART_HOME,
      product_focused: PROMPT_TEMPLATES.PRODUCT_FOCUSED
    };

    return templates[scenario].replace(/\{topic\}/g, topic);
  }

  // 品牌检测 - 识别搜索中的主要品牌
  static detectBrand(topic: string): string | null {
    const lowerTopic = topic.toLowerCase();
    
    const brands = {
      'tplink': ['tplink', 'tp-link', 'archer', 'deco', 'omada', 'kasa', 'tapo'],
      'netgear': ['netgear', 'nighthawk', 'orbi', 'arlo'],
      'linksys': ['linksys', 'velop', 'max-stream'],
      'asus': ['asus', 'rog', 'aimesh', 'asuswrt'],
      'ubiquiti': ['ubiquiti', 'unifi', 'amplifi', 'dream machine'],
      'google': ['google nest', 'nest wifi', 'google wifi'],
      'amazon': ['eero', 'amazon eero'],
      'cisco': ['cisco', 'meraki'],
      'dlink': ['d-link', 'dlink', 'dir-'],
      'xiaomi': ['xiaomi', 'mi router', 'redmi'],
      'huawei': ['huawei', 'honor router']
    };
    
    for (const [brand, keywords] of Object.entries(brands)) {
      if (keywords.some(keyword => lowerTopic.includes(keyword))) {
        return brand;
      }
    }
    
    return null;
  }

  // 获取品牌相关机型推荐
  static getBrandRecommendations(brand: string): string[] {
    const recommendations: Record<string, string[]> = {
      'tplink': [
        'TP-Link Archer AX6000', 'TP-Link Deco X60', 'TP-Link Archer AX73',
        'TP-Link Omada EAP660 HD', 'TP-Link Kasa Smart Switch', 'TP-Link Tapo Camera'
      ],
      'netgear': [
        'Netgear Nighthawk AX12', 'Netgear Orbi AX6000', 'Netgear Nighthawk Pro Gaming',
        'Netgear RAX200', 'Netgear Arlo Pro 4', 'Netgear Nighthawk M5'
      ],
      'linksys': [
        'Linksys Velop AX4200', 'Linksys MX10', 'Linksys EA9500',
        'Linksys Max-Stream AC2200', 'Linksys Velop MX5300'
      ],
      'asus': [
        'ASUS ROG Rapture GT-AX11000', 'ASUS AX6000', 'ASUS ZenWiFi AX6600',
        'ASUS RT-AX88U', 'ASUS AiMesh AX5700'
      ],
      'google': [
        'Google Nest Wifi Pro 6E', 'Google Nest Wifi', 'Google Nest Hub Max',
        'Google Nest Thermostat', 'Google Nest Doorbell'
      ],
      'amazon': [
        'Amazon eero Pro 6E', 'Amazon eero 6+', 'Amazon eero Pro 6',
        'Amazon Echo Dot', 'Amazon Fire TV Stick'
      ]
    };
    
    return recommendations[brand] || [];
  }

  // 智能场景检测 - 根据topic内容自动选择最合适的prompt
  static detectScenario(topic: string): 'general' | 'tplink' | 'tech' | 'smart_home' | 'product_focused' {
    const lowerTopic = topic.toLowerCase();

    // 竞品分析关键词检测 - 只有明确要求竞品分析时才使用特殊模板
    const competitorAnalysisKeywords = [
      '竞品', '竞争对手', 'competitor', 'compare brands', 'brand comparison', 
      'market analysis', '对比分析', '品牌对比'
    ];

    // TP-Link竞品分析 - 只有TP-Link + 竞品分析时才使用
    const tplinkBrands = ['tplink', 'tp-link'];
    const isTPLink = tplinkBrands.some(brand => lowerTopic.includes(brand));
    const isCompetitorAnalysis = competitorAnalysisKeywords.some(keyword => lowerTopic.includes(keyword));
    
    if (isTPLink && isCompetitorAnalysis) {
      return 'tplink';
    }

    // 智能家居生态分析 - 只有明确询问整个智能家居生态时才使用
    const smartHomeEcosystemKeywords = [
      'smart home ecosystem', 'home automation system', 'iot platform',
      '智能家居生态', '全屋智能', '智能家居系统'
    ];

    if (smartHomeEcosystemKeywords.some(keyword => lowerTopic.includes(keyword))) {
      return 'smart_home';
    }

    // 默认使用产品聚焦模板 - 这是大多数用户的真实需求
    // 用户通常是在寻找特定产品的评测者，而不是泛泛的内容
    return 'product_focused';
  }
}

// 使用示例:
// const prompt = PromptSelector.getPrompt('TP-Link Archer AX6000 vs competitors', 'tplink');
// const autoPrompt = PromptSelector.getPrompt(topic, PromptSelector.detectScenario(topic));