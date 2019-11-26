# transition-alpha
DAWのアルファ版

~~主に画面遷移の確認用~~と言いつつ機能ガッツリ実装してます。

***【重要】リポジトリを移行しました。最新のものは[こちら](https://github.com/suzupro2019/Deeparture)***

## 動かし方
以下、全てコマンドライン上で実行

```:command-line
$ git clone https://github.com/ne290008/transition-alpha.git
$ cd transition-alpha
$ python manage.py migrate
$ python manage.py createsuperuser
$ python manage.py runserver
```

- `createsuperuser`で管理者権限を持つアカウントが作成できる。管理者権限を持つアカウントは管理サイト [`http://127.0.0.1:8000/admin/`] にアクセスすることができる。必要ない場合は実行しなくてもよい。

- `runserver`とすると開発用サーバが起動する。`http://127.0.0.1:8000/`にアクセスするとページが表示される。

<br>

*注）関連パッケージのインストールが済んでいない場合はインストールする。関連パッケージ は`requirements.txt`を参照。以下コマンドの実行により一括でインストールすることができる。*

```:command-line
$ pip install -r requirements.txt
```
