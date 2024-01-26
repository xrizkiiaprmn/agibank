import fetch from 'node-fetch';

class SmsHub {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getPrices(service, country) {
    const req = await fetch(
      `https://smshub.org/stubs/handler_api.php?api_key=${this.apiKey}&action=getPrices&service=${service}&country=${country}`
    );

    const res = await req.json();
    console.info('Harga\t\tStock');
    console.table(res[`${country}`][service]);
  }

  async getBalance() {
    const req = await fetch(
      `https://smshub.org/stubs/handler_api.php?api_key=${this.apiKey}&action=getBalance`
    );

    const res = await req.text();
    return res.split(':')[1];
  }

  async orderNumber(service, operator, country, maxprice) {
    const req = await fetch(
      `https://smshub.org/stubs/handler_api.php?api_key=${this.apiKey}&action=getNumber&service=${service}&operator=${operator}&country=${country}&maxPrice=${maxprice}`
    );

    const res = await req.text();
    const [desc, id, number] = res.split(':');
    return [id, number];
  }

  async getStatusNumber(id) {
    const req = await fetch(
      `https://smshub.org/stubs/handler_api.php?api_key=${this.apiKey}&action=getStatus&id=${id}`
    );

    const res = await req.text();
    return res;
  }

  async setStatusNumber(id, status) {
    const req = await fetch(
      `https://smshub.org/stubs/handler_api.php?api_key=${this.apiKey}&action=setStatus&status=${status}&id=${id}`
    );

    const res = await req.text();
    return res;
  }

  async getSmsCode(id, timeout) {
    let otp;
    let condition = true;
    let innerCondition = true;

    const timeoutOtp = setTimeout(async () => {
      await this.setStatusNumber(id, 8);
      otp = `OTP Dibatalkan Karena Melebihi Batas Waktu, Mendapatkan nomor baru...`;
      innerCondition = false;
    }, timeout);

    while (condition) {
      let code = await this.getStatusNumber(id);
      if (code.search(':') > 0) {
        const data = code.split(':');
        otp = data[1].slice(26, data[1].length);
        clearTimeout(timeoutOtp);
        condition = false;
      } else {
        condition = innerCondition;
      }
    }

    return otp;
  }
}

export default SmsHub;
