define(['axios'], (Axios) => {
    const STATUS_PENDING = 'pending';
    const STATUS_OK = 'ok';
    const STATUS_FAIL = 'fail';

    class resource {
        constructor() {
            this.loaded = {};
        }
        async load(list) {
            const pendingTasks = [];
            list.forEach(item => {
                if (Object.keys(this.loaded).includes(item.id))
                    throw "duplicated resource id";
                const _obj = {
                    url: item.url,
                    status: STATUS_PENDING,
                    buffer: null,
                };
                this.loaded[item.id] = _obj;
                pendingTasks.push(this.__axios_get(_obj));
            });
            return await Promise.allSettled(pendingTasks);
        }
        get(id) {
            if (!this.check(id)) throw "not ready resource";
            const buffer = this.loaded[id].buffer;
            return { buffer, toString: () => new TextDecoder().decode(buffer) };
        }
        has(id) {
            return Object.keys(this.loaded).includes(id);
        }
        check(id) {
            return this.loaded[id]?.status;
        }
        blob(id) {
            return new Blob([this.get(id).buffer]);
        }
        async* wait(idList) {
            const total = idList.length;
            let current = 0;
            const _list = Array.from(idList);
            while (current < total) {
                for (let i = 0; i < _list.length; i++) {
                    const status = this.check(_list[i]);
                    if (status === STATUS_PENDING) continue;
                    else if (status === STATUS_OK) {
                        yield { total, current: ++current, id: _list.splice(i, 1).join(), waitting: Array.from(_list) };
                        break;
                    }
                    else if (status === STATUS_FAIL) {
                        yield Promise.reject({ total, current, id: _list[i], waitting: _list, reason: 'resource load failed' });
                        return;
                    }
                    yield Promise.reject({ total, current, id: _list[i], waitting: _list, reason: 'unknown resource' });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        async retry(id) {
            const _obj = this.loaded[id];
            if (_obj.status === STATUS_FAIL) {
                _obj.status = STATUS_PENDING;
                return await __axios_get(_obj);
            }
            else return _obj.status;
        }
        retryAll() {
            const _list = [];
            Object.entries(this.loaded).forEach(([id, _obj]) => {
                if (_obj.status === STATUS_FAIL) {
                    _list.push(id);
                    this.retry(id);
                }
            });
            return this.wait(_list);
        }
        __axios_get(_obj) {
            return Axios.get(_obj.url, { responseType: 'arraybuffer' })
                .then(res => {
                    _obj.buffer = res.data;
                    return _obj.status = STATUS_OK;
                }).catch(e => {
                    console.warn('resource download failed', _obj, e);
                    return _obj.status = STATUS_FAIL;
                });
        }
    }
    return { resource, CONST: { STATUS_PENDING, STATUS_OK, STATUS_FAIL } };
});