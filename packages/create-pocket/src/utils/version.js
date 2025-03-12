const REGISTRY_URLS = ['https://registry.npmmirror.com']

export async function getLatestVersion(packageName) {
  const controllers = REGISTRY_URLS.map(() => new AbortController())
  const requests = REGISTRY_URLS.map((registry, index) =>
    fetch(`${registry}/${packageName}`, {
      method: 'GET',
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'max-age=0',
        'if-modified-since': 'Fri, 10 Jan 2025 14:28:27 GMT',
        'if-none-match': 'W/"3130243c01a23685dc13c59c9355a763"',
        priority: 'u=0, i',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
      signal: controllers[index].signal,
    })
      .then(handleResponse(index, controllers))
      .catch(handleError(index)),
  )

  try {
    const results = await Promise.all(requests)
    return processResults(results)
  } finally {
    controllers.forEach((c) => c.abort())
  }
}

// 响应处理函数
function handleResponse(index, controllers) {
  return async (response) => {
    controllers.forEach((c, i) => i !== index && c.abort())
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}

// 错误处理函数
function handleError(index) {
  return (error) => {
    if (error.name !== 'AbortError') {
      console.warn(`Registry ${REGISTRY_URLS[index]} 请求失败: ${error.message}`)
    }
    return null
  }
}

// 处理结果
function processResults(results) {
  const success = results.find((r) => r !== null)
  return success ? `^${success['dist-tags'].latest}` : 'latest'
}
