import {afterEach,describe,expect,it,vi} from 'vitest';
import {loginAccount,restoreSession} from './authService';
import {loginDemoUser, registerDemoUser} from './demoMode';

const apiUser={id:'u1',name:'Jane Doe',email:'jane@example.com',role:'CUSTOMER'};
const response=(body:unknown,status=200)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

describe('authentication API client',()=>{
  afterEach(()=>{vi.unstubAllGlobals(); localStorage.clear();});

  it('sends login credentials with browser cookies enabled',async()=>{
    const fetchMock=vi.fn().mockResolvedValue(response({user:apiUser}));vi.stubGlobal('fetch',fetchMock);
    await expect(loginAccount('jane@example.com','StrongPass1!')).resolves.toMatchObject({id:'u1',role:'customer'});
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/login'),expect.objectContaining({credentials:'include',method:'POST'}));
  });

  it('refreshes an expired access session before restoring the user',async()=>{
    const fetchMock=vi.fn().mockResolvedValueOnce(response({message:'expired'},401)).mockResolvedValueOnce(response({user:apiUser})).mockResolvedValueOnce(response({user:apiUser}));vi.stubGlobal('fetch',fetchMock);
    await expect(restoreSession()).resolves.toMatchObject({email:'jane@example.com'});
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns no user when both access and refresh sessions are invalid',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({message:'unauthorized'},401)));
    await expect(restoreSession()).resolves.toBeNull();
  });

  it('supports built-in demo users and trims accidental mobile password spaces',()=>{
    expect(loginDemoUser('cliente@tienda.com','Cliente123*')).toMatchObject({email:'cliente@tienda.com',role:'customer'});
    registerDemoUser('Mobile User','mobile@example.com',' StrongPass1! ');
    expect(loginDemoUser('mobile@example.com','StrongPass1!')).toMatchObject({email:'mobile@example.com'});
  });
});
