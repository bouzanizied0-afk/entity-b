def chaotic_numeric_translate(s_k, sigma_k, t_k, N=10**9+7):
    # هنا s_k أي إدخال رقمي ديناميكي (لا تحويل ثابت)
    a = (sigma_k * (t_k + 1)) % N
    b = ((t_k + 1) * s_k) % N
    exp1 = (sigma_k % (t_k + 2)) + 1
    exp2 = (t_k % (sigma_k + 2)) + 1
    x_k = pow(a, exp1, N) ^ pow(b, exp2, N)  # تركيب غير تبادلي
    sigma_next = x_k  # تحديث الحالة
    return x_k, sigma_next

# مثال سريع
if __name__ == "__main__":
    sigma = 1
    symbols = [7, 13, 2]  # أي تمثيل رقمي داخلي عشوائي للرموز
    t_seq = [1, 2, 3]
    for s, t in zip(symbols, t_seq):
        x, sigma = chaotic_numeric_translate(s, sigma, t)
        print(f"s={s}, t={t}, x={x}, sigma_next={sigma}")
