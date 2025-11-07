const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export const formatVND = (amount) => {
    return vnd.format(amount)
}
