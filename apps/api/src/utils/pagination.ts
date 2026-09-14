export interface PageWindow {
  /** 传给数据库的偏移量 */
  skip: number
  take: number
  /** 实际生效的页码（超出范围时会收敛到最后一页） */
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 计算分页窗口。
 * 页码超出范围时收敛到最后一页，而不是返回一个空列表——
 * 用户删掉一件商品后回退到列表页时，不应该看到「什么都没有」。
 */
export function resolvePageWindow(page: number, pageSize: number, total: number): PageWindow {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  return {
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    page: safePage,
    pageSize,
    totalPages
  }
}
