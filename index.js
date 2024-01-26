import SmsHub from './smshub.js';
import fs from 'fs';
import readlineSync from 'readline-sync';
import cheerio from 'cheerio';
import { fullName } from 'full-name-generator';

class AgiBank {
  constructor(reffCode, smshub) {
    this.reffCode = reffCode;
    this.smshub = smshub;
  }

  domainList;

  async menu() {
    console.info(
      `================ Agi Refferal Tools ================\n\n1. Cek Saldo SMSHub\n2. Start!\n3. Exit\n`
    );
    const menuChoosen = readlineSync.question('Masukkan Pilihan\t\t: ');

    switch (menuChoosen) {
      case '1':
        console.info(`\nSMSHub Balance is ${await this.smshub.getBalance()}`);
        break;
      case '2':
        await this.start();
        break;
      default:
        console.info('Terimakasih tuan!');
        break;
    }
  }

  async getDomainEmail() {
    return new Promise((resolve, reject) => {
      fetch(`https://generator.email/`, {
        method: 'get',
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
          'accept-encoding': 'gzip, deflate, br',
        },
      })
        .then((res) => res.text())
        .then((text) => {
          const $ = cheerio.load(text);
          const result = [];
          $('.e7m.tt-suggestions')
            .find('div > p')
            .each(function (index, element) {
              result.push($(element).text());
            });
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }

  getRandomString(length) {
    return new Promise((resolve, reject) => {
      let text = '';
      let possible =
        'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      resolve(text);
    });
  }

  getRandomName() {
    const gender = Math.floor(Math.random() * 2);
    return fullName('ID', gender, 1, 2);
  }

  async start() {
    const count = readlineSync.question('Masukkan jumlah refferal\t: ');
    const timeout = readlineSync.question('Masukkan timeout otp (ms)\t: ');
    this.domainList = await this.getDomainEmail();

    for (let i = 1; i <= count; i++) {
      const name = this.getRandomName();
      const email = `${name.replaceAll(' ', '')}${await this.getRandomString(
        5
      )}@${
        this.domainList[Math.floor(Math.random() * this.domainList.length)]
      }`.toLocaleLowerCase();
      let [idNumber, number] = await this.smshub.orderNumber('ot', 'any', 6, 2);

      console.info(
        `\nData akun ke-${i}\nNama\t\t: ${name}\nEmail\t\t: ${email}\nNo. HP\t\t: ${number}\nKode Reff\t: ${this.reffCode}`
      );

      let condition = true;
      while (condition) {
        console.info(
          `Menunggu kode otp dengan timeout ${timeout / 1000} detik`
        );
        let otp = await this.smshub.getSmsCode(idNumber, Number(timeout));

        if (otp.length > 10) {
          let newNumber = await this.smshub.orderNumber('ot', 'any', 6, 2);
          idNumber = newNumber[0];
          number = newNumber[1];
          console.info(otp);
          console.info(`No. HP Baru\t: ${number}`);
          continue;
        }

        condition = false;
        console.info(`Kode OTP\t: ${otp}`);
      }
    }
  }
}

try {
  const apiKey = fs.readFileSync('./apikey.txt', { encoding: 'utf-8' });
  const reffCode = fs.readFileSync('./reffcode.txt', { encoding: 'utf-8' });
  const smshub = new SmsHub(apiKey);
  const agi = new AgiBank(reffCode, smshub);
  await agi.menu();
} catch (e) {
  console.info(e);
}

// const [id, number] = await smshub.orderNumber('ot', 'any', 6, 3);
// console.info(`ID\t: ${id}\nNUMBER\t: ${number}`);
// await smshub.getSmsCode(id, 60000);
